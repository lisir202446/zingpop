import { existsSync, readdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

export function desktopDataHome() {
  return process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share")
}

export function sqliteFileExists(dataHome = desktopDataHome()) {
  return existsSync(join(dataHome, "opencode", "opencode.db"))
}

export function legacyJsonStorageExists(dataHome = desktopDataHome()) {
  const storage = join(dataHome, "opencode", "storage")
  if (!existsSync(storage)) return false
  return readdirSync(storage).length > 0
}

export function shouldRunJsonMigration(dataHome = desktopDataHome()) {
  if (sqliteFileExists(dataHome)) return false
  return legacyJsonStorageExists(dataHome)
}
