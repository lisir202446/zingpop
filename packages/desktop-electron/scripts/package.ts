#!/usr/bin/env bun
import { existsSync } from "node:fs"
import { join } from "node:path"

const builder = process.platform === "win32" ? join("node_modules", ".bin", "electron-builder.exe") : join("node_modules", ".bin", "electron-builder")
if (!existsSync(join(import.meta.dir, "..", builder))) {
  throw new Error("electron-builder is missing. Run `bun install` before packaging.")
}

const env = {
  ...Bun.env,
  OPENCODE_CHANNEL: "prod",
}

const build = Bun.spawn(["bun", "run", "build"], {
  cwd: join(import.meta.dir, ".."),
  stdout: "inherit",
  stderr: "inherit",
  env,
})

const buildExitCode = await build.exited
if (buildExitCode !== 0) process.exit(buildExitCode)

const packageArgs = Bun.argv.slice(2)
const localWindowsDirectoryBuild =
  process.platform === "win32" &&
  process.env.GITHUB_ACTIONS !== "true" &&
  packageArgs.includes("--win") &&
  !packageArgs.includes("--dir")

if (localWindowsDirectoryBuild) {
  console.log("Building local Windows directory bundle; GitHub Actions builds the signed installer.")
}

const proc = Bun.spawn(
  [builder, ...packageArgs, ...(localWindowsDirectoryBuild ? ["--dir"] : []), "--config", "electron-builder.config.ts"],
  {
  cwd: join(import.meta.dir, ".."),
  stdout: "inherit",
  stderr: "inherit",
  env,
  },
)

const exitCode = await proc.exited
if (exitCode !== 0) process.exit(exitCode)
