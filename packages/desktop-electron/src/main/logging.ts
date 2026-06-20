import log from "electron-log/main.js"
import { app } from "electron"
import { readFileSync, readdirSync, statSync, unlinkSync } from "node:fs"
import { dirname, join } from "node:path"
import { handleConsolePipeError } from "./logging-pipe"

const MAX_LOG_AGE_DAYS = 7
const TAIL_LINES = 1000
let consolePipeSafetyInstalled = false

export function initLogging() {
  log.transports.file.maxSize = 5 * 1024 * 1024
  if (app.isPackaged) log.transports.console.level = false
  ignoreBrokenConsolePipes()
  cleanup()
  return log
}

export function tail(): string {
  try {
    const path = log.transports.file.getFile().path
    const contents = readFileSync(path, "utf8")
    const lines = contents.split("\n")
    return lines.slice(Math.max(0, lines.length - TAIL_LINES)).join("\n")
  } catch {
    return ""
  }
}

function cleanup() {
  const path = log.transports.file.getFile().path
  const dir = dirname(path)
  const cutoff = Date.now() - MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000

  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry)
    try {
      const info = statSync(file)
      if (!info.isFile()) continue
      if (info.mtimeMs < cutoff) unlinkSync(file)
    } catch {
      continue
    }
  }
}

function ignoreBrokenConsolePipes() {
  if (consolePipeSafetyInstalled) return
  consolePipeSafetyInstalled = true
  ;[process.stdout, process.stderr].forEach((stream) => {
    stream.on("error", handleConsolePipeError)
  })
}
