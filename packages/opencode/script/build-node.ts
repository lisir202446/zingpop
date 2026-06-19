#!/usr/bin/env bun

import { $ } from "bun"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
process.chdir(dir)

if (process.env.OPENCODE_REFRESH_MODELS === "1") {
  await import("./generate.ts")
}

import { Script } from "@opencode-ai/script"

async function loadMigrations() {
  return await Promise.all(
    (
      await fs.promises.readdir(path.join(dir, "migration"), { withFileTypes: true })
    )
      .filter((entry) => entry.isDirectory() && /^\d{4}\d{2}\d{2}\d{2}\d{2}\d{2}/.test(entry.name))
      .map((entry) => entry.name)
      .sort()
      .map(async (name) => {
        const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(name)
        return {
          sql: await Bun.file(path.join(dir, "migration", name, "migration.sql")).text(),
          timestamp: match
            ? Date.UTC(
                Number(match[1]),
                Number(match[2]) - 1,
                Number(match[3]),
                Number(match[4]),
                Number(match[5]),
                Number(match[6]),
              )
            : 0,
          name,
        }
      }),
  )
}

await $`rm -rf dist/node`

const result = await Bun.build({
  entrypoints: ["./src/node.ts"],
  outdir: "dist/node",
  target: "node",
  format: "esm",
  splitting: true,
  sourcemap: "external",
  conditions: ["node"],
  external: ["@lydell/node-pty", "jsonc-parser", "node-gyp"],
  define: {
    OPENCODE_VERSION: `'${Script.version}'`,
    OPENCODE_CHANNEL: `'${Script.channel}'`,
    OPENCODE_MIGRATIONS: JSON.stringify(await loadMigrations()),
    OPENCODE_LIBC: "undefined",
  },
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

console.log("Built opencode node server module: dist/node/node.js")
