#!/usr/bin/env bun

import { fileURLToPath } from "node:url"

const repo = fileURLToPath(new URL("../", import.meta.url))
const bun = globalThis.process.execPath

const commands = [
  {
    label: "Zingpop GLM config",
    cwd: repo,
    cmd: [bun, "scripts/verify-zingpop-opencode-config.mjs"],
  },
  {
    label: "Zingpop app user experience contract",
    cwd: fileURLToPath(new URL("../packages/app/", import.meta.url)),
    cmd: [
      bun,
      "test",
      "--preload",
      "./happydom.ts",
      "./src/pages/session/zingpop-user-experience-contract.test.ts",
      "./src/utils/session-progress-narrative.test.ts",
      "./src/pages/session/session-progress-narrative.test.tsx",
      "./src/pages/session/session-progress-narrative-source.test.ts",
      "./src/pages/session/zingpop-preview-panel.test.ts",
      "./src/utils/zingpop-preview.test.ts",
    ],
  },
  {
    label: "Zingpop UI user-facing output contract",
    cwd: fileURLToPath(new URL("../packages/ui/", import.meta.url)),
    cmd: [
      bun,
      "test",
      "./src/components/message-part-user-facing.test.ts",
      "./src/components/session-turn-source.test.ts",
      "./src/components/session-turn.test.ts",
    ],
  },
]

const run = async (task) => {
  console.log(`\n== ${task.label} ==`)
  console.log(task.cmd.join(" "))

  const process = Bun.spawn({
    cmd: task.cmd,
    cwd: task.cwd,
    stdout: "inherit",
    stderr: "inherit",
  })
  const code = await process.exited
  if (code === 0) return

  console.error(`\nZingpop user experience verification failed at: ${task.label}`)
  globalThis.process.exit(code)
}

await commands.reduce((previous, task) => previous.then(() => run(task)), Promise.resolve())

console.log(
  "\nZingpop user experience verified: readable progress narrative, generic thinking suppression, raw process filtering, and HTML preview target detection.",
)
