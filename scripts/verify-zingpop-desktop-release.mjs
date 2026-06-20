#!/usr/bin/env bun

import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const args = new Set(process.argv.slice(2))
const repo = process.env.ZINGPOP_GITHUB_REPO || "lisir202446/zingpop"
const requireGithubSecrets =
  args.has("--require-github-secrets") || process.env.ZINGPOP_REQUIRE_DESKTOP_RELEASE_SECRETS === "1"
const requiredSecrets = [
  "AZURE_CLIENT_ID",
  "AZURE_TENANT_ID",
  "AZURE_SUBSCRIPTION_ID",
  "AZURE_TRUSTED_SIGNING_ENDPOINT",
  "AZURE_TRUSTED_SIGNING_ACCOUNT_NAME",
  "AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE",
]

function fail(message) {
  console.error(`Zingpop desktop release check failed: ${message}`)
  process.exit(1)
}

async function read(relative) {
  return Bun.file(path.join(root, relative)).text()
}

function requireText(label, content, needle) {
  if (content.includes(needle)) return [`ok ${label}`]
  fail(`${label} is missing: ${needle}`)
}

function runGhSecretList() {
  const result = spawnSync("gh", ["secret", "list", "--repo", repo], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  })

  if (result.status === 0) return result.stdout
  if (!requireGithubSecrets) {
    return ""
  }

  fail((result.stderr || result.stdout || "gh secret list failed").trim())
}

const workflow = await read(".github/workflows/zingpop-desktop-release.yml")
const builder = await read("packages/desktop-electron/electron-builder.config.ts")
const main = await read("packages/desktop-electron/src/main/index.ts")
const logging = await read("packages/desktop-electron/src/main/logging.ts")
const loggingPipe = await read("packages/desktop-electron/src/main/logging-pipe.ts")
const packageJson = JSON.parse(await read("packages/desktop-electron/package.json"))
const checks = [
  ...requireText("release workflow dispatch", workflow, "workflow_dispatch:"),
  ...requireText("release workflow signing requirement", workflow, 'ZINGPOP_REQUIRE_WINDOWS_SIGNING: "true"'),
  ...requireText(
    "release workflow signing secret guard",
    workflow,
    "Missing required GitHub secrets for Windows signing",
  ),
  ...requireText("release workflow Authenticode verification", workflow, "Get-AuthenticodeSignature"),
  ...requireText("release workflow installer verification", workflow, "zingpop-desktop-win-x64.exe"),
  ...requireText("release workflow update metadata verification", workflow, "ZINGPOP_UPDATE_YML"),
  ...requireText("electron-builder Windows target", builder, 'target: ["nsis"]'),
  ...requireText("electron-builder production publish", builder, 'channel: "latest"'),
  ...requireText("electron-builder signing script", builder, 'script", "sign-windows.ps1'),
  ...requireText("desktop auto-update", main, "autoUpdater.checkForUpdates()"),
  ...requireText("desktop packaged updater metadata guard", main, "app-update.yml"),
  ...requireText("packaged console logging disabled", logging, "log.transports.console.level = false"),
  ...requireText("EPIPE logging guard", loggingPipe, "EPIPE"),
]

for (const name of ["build", "package:win:prod", "smoke:5", "test:ci", "typecheck"]) {
  if (packageJson.scripts?.[name]) {
    checks.push(`ok desktop script ${name}`)
    continue
  }

  fail(`desktop package script is missing: ${name}`)
}

const secretOutput = runGhSecretList()
const configuredSecrets = new Set(
  secretOutput
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean),
)
const missingSecrets = requiredSecrets.filter((name) => !configuredSecrets.has(name))

if (requireGithubSecrets && missingSecrets.length > 0) {
  fail(`Missing GitHub desktop signing secrets in ${repo}: ${missingSecrets.join(", ")}`)
}

console.log("Zingpop desktop release static checks passed")
for (const check of checks) console.log(`- ${check}`)

if (missingSecrets.length > 0) {
  console.log("")
  console.log(`GitHub signing secrets not fully configured for ${repo}: ${missingSecrets.join(", ")}`)
  console.log("Run again with --require-github-secrets before publishing a signed desktop release.")
  process.exit(0)
}

console.log("")
console.log(`GitHub signing secrets configured for ${repo}`)
