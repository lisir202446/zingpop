#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"

const args = process.argv.slice(2)
const value = (name, fallback) => {
  const index = args.indexOf(name)
  if (index === -1) return fallback
  return args[index + 1] ?? fallback
}
const repo = resolve(value("--repo", process.cwd()))
const envFile = value("--env-file", "/etc/zingpop/zingpop.env")
const strict = args.includes("--strict")
const checks = []

function record(status, name, detail) {
  checks.push({ status, name, detail })
}

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=")
        if (index === -1) return [line, ""]
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")]
      }),
  )
}

function repositoryFiles() {
  const result = spawnSync("git", ["-C", repo, "ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  if (result.status !== 0) return []
  return result.stdout.split(/\r?\n/).filter(Boolean)
}

function scanRepositorySecrets() {
  const token = /(ghp_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{50,})/
  const hits = repositoryFiles()
    .filter((file) => !file.includes("node_modules/"))
    .filter((file) => !file.endsWith(".png") && !file.endsWith(".jpg") && !file.endsWith(".woff") && !file.endsWith(".woff2"))
    .flatMap((file) => {
      try {
        const source = readFileSync(join(repo, file), "utf8")
        if (source.length > 1_000_000) return []
        return token.test(source) ? [file] : []
      } catch {
        return []
      }
    })
  if (hits.length) return record("fail", "repository GitHub token scan", hits.join(", "))
  record("pass", "repository GitHub token scan", "no GitHub token patterns found in tracked or untracked text files")
}

function checkEnvFile() {
  if (!existsSync(envFile)) {
    return record(strict ? "fail" : "warn", "production env file", `${envFile} does not exist on this machine`)
  }

  const stat = lstatSync(envFile)
  if (process.platform !== "win32" && (stat.mode & 0o077) !== 0) {
    record("fail", "production env permissions", `${envFile} must not be group/world readable`)
  } else {
    record("pass", "production env permissions", `${envFile} permissions are restricted`)
  }

  const env = parseEnv(readFileSync(envFile, "utf8"))
  const weak = /^(|password|changeme|change-me|opencode|zingpop|123456)$/i
  if (!env.OPENCODE_SERVER_PASSWORD || env.OPENCODE_SERVER_PASSWORD.length < 24 || weak.test(env.OPENCODE_SERVER_PASSWORD)) {
    record("fail", "OPENCODE_SERVER_PASSWORD", "missing, weak, or default")
  } else {
    record("pass", "OPENCODE_SERVER_PASSWORD", "present and non-default length")
  }

  for (const key of ["MYSQL_PASSWORD", "SMS_PROVIDER"]) {
    record(env[key] ? "pass" : strict ? "fail" : "warn", key, env[key] ? "present" : "missing")
  }
}

function checkRepoFiles() {
  for (const path of [
    "deploy/nginx/zingpop-app.conf",
    "deploy/nginx/zingpop-www.conf",
    "deploy/logrotate/zingpop",
    "deploy/systemd/zingpop-backup.service",
    "deploy/systemd/zingpop-backup.timer",
    "deploy/systemd/zingpop-health-check.service",
    "deploy/systemd/zingpop-health-check.timer",
    "scripts/production-backup.sh",
    "scripts/production-restore-drill.sh",
    "scripts/production-health-check.mjs",
    "scripts/production-rotate-local-secrets.sh",
    "scripts/production-isolation-probe.mjs",
    "scripts/production-auth-sms-probe.mjs",
    "docs/security-operations.md",
    "docs/open-source-notices.md",
    "docs/model-provider-compliance.md",
  ]) {
    record(existsSync(join(repo, path)) ? "pass" : "fail", path, existsSync(join(repo, path)) ? "present" : "missing")
  }

  const nginx = readFileSync(join(repo, "deploy/nginx/zingpop-app.conf"), "utf8")
  for (const required of [
    "auth_request",
    "127.0.0.1:3000",
    "127.0.0.1:4096",
    "client_max_body_size",
    "return 403",
    "limit_req_zone $binary_remote_addr zone=zingpop_app_project",
    "limit_req_zone $binary_remote_addr zone=zingpop_app_workbench",
    "limit_req_status 429",
  ]) {
    record(nginx.includes(required) ? "pass" : "fail", `nginx app ${required}`, nginx.includes(required) ? "present" : "missing")
  }

  const www = readFileSync(join(repo, "deploy/nginx/zingpop-www.conf"), "utf8")
  for (const required of [
    "limit_req_zone $binary_remote_addr zone=zingpop_www_auth",
    "limit_req_zone $binary_remote_addr zone=zingpop_www_model",
    "limit_req_status 429",
    "location ^~ /auth/",
    "location ^~ /zen/v1/",
  ]) {
    record(www.includes(required) ? "pass" : "fail", `nginx www ${required}`, www.includes(required) ? "present" : "missing")
  }
}

checkEnvFile()
scanRepositorySecrets()
checkRepoFiles()

for (const check of checks) {
  console.log(`${check.status.toUpperCase()} ${check.name}: ${check.detail}`)
}

const failures = checks.filter((check) => check.status === "fail")
if (failures.length) {
  console.error(`production security check failed: ${failures.length} issue(s)`)
  process.exit(1)
}

console.log("production security check completed")
