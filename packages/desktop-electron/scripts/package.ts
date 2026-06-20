#!/usr/bin/env bun
import { existsSync, readdirSync, rmSync } from "node:fs"
import { join } from "node:path"

const builder = process.platform === "win32" ? join("node_modules", ".bin", "electron-builder.exe") : join("node_modules", ".bin", "electron-builder")
if (!existsSync(join(import.meta.dir, "..", builder))) {
  throw new Error("electron-builder is missing. Run `bun install` before packaging.")
}

const packageArgs = Bun.argv.slice(2)
const localWindowsDirectoryBuild =
  process.platform === "win32" &&
  process.env.GITHUB_ACTIONS !== "true" &&
  packageArgs.includes("--win") &&
  !packageArgs.includes("--dir")

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

if (localWindowsDirectoryBuild) {
  const dist = join(import.meta.dir, "..", "dist")
  if (existsSync(dist)) {
    for (const file of readdirSync(dist)) {
      if (
        file === "zingpop-desktop-win-x64.exe" ||
        file === "zingpop-desktop-win-x64.zip" ||
        file.endsWith(".nsis.7z")
      ) {
        rmSync(join(dist, file), { force: true })
      }
    }
  }
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

if (localWindowsDirectoryBuild) {
  const zip = join(import.meta.dir, "..", "dist", "zingpop-desktop-win-x64.zip")
  const archive = Bun.spawn(
    [
      "powershell.exe",
      "-NoLogo",
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${join(import.meta.dir, "..", "dist", "win-unpacked", "*")}' -DestinationPath '${zip}' -CompressionLevel Optimal`,
    ],
    {
      stdout: "inherit",
      stderr: "inherit",
    },
  )
  if ((await archive.exited) !== 0) process.exit(1)
  console.log(`Created ${zip}`)
}
