#!/usr/bin/env bun
import { randomUUID } from "node:crypto"
import { existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const runs = Number.parseInt(Bun.argv[2] ?? "1", 10)
if (!Number.isInteger(runs) || runs < 1) throw new Error("Usage: bun ./scripts/smoke.ts [positive-run-count]")

const electron = process.platform === "win32" ? join("node_modules", ".bin", "electron.exe") : join("node_modules", ".bin", "electron")
if (!existsSync(join(import.meta.dir, "..", "out", "main", "index.js"))) {
  throw new Error("Desktop build output is missing. Run `bun run build` first.")
}
if (!existsSync(join(import.meta.dir, "..", electron))) {
  throw new Error("Electron binary is missing. Run `bun install` for packages/desktop-electron first.")
}

for (const run of Array.from({ length: runs }, (_, index) => index + 1)) {
  const userData = join(tmpdir(), `zingpop-desktop-smoke-${randomUUID()}`)
  const proc = Bun.spawn([electron, "."], {
    cwd: join(import.meta.dir, ".."),
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...Bun.env,
      OPENCODE_CHANNEL: Bun.env.OPENCODE_CHANNEL ?? "dev",
      ZINGPOP_DESKTOP_SMOKE: "1",
      ZINGPOP_DESKTOP_SMOKE_TIMEOUT_MS: Bun.env.ZINGPOP_DESKTOP_SMOKE_TIMEOUT_MS ?? "60000",
      ZINGPOP_DESKTOP_USER_DATA: userData,
      ELECTRON_ENABLE_LOGGING: "1",
    },
  })

  const [exitCode, stdout, stderr] = await Promise.all([proc.exited, new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  rmSync(userData, { recursive: true, force: true })

  if (exitCode !== 0) {
    console.error(stdout)
    console.error(stderr)
    throw new Error(`Zingpop desktop smoke run ${run}/${runs} failed with exit code ${exitCode}`)
  }

  console.log(`Zingpop desktop smoke run ${run}/${runs} passed.`)
}
