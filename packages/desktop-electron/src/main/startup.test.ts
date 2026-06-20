import { describe, expect, test } from "bun:test"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { legacyJsonStorageExists, shouldRunJsonMigration, sqliteFileExists } from "./startup"

function tempDataHome() {
  return mkdtempSync(join(tmpdir(), "zingpop-desktop-startup-"))
}

describe("desktop startup migration gate", () => {
  test("fresh desktop profile skips legacy JSON migration", () => {
    const dataHome = tempDataHome()
    expect(sqliteFileExists(dataHome)).toBe(false)
    expect(legacyJsonStorageExists(dataHome)).toBe(false)
    expect(shouldRunJsonMigration(dataHome)).toBe(false)
  })

  test("existing sqlite database skips legacy JSON migration", () => {
    const dataHome = tempDataHome()
    mkdirSync(join(dataHome, "opencode"), { recursive: true })
    writeFileSync(join(dataHome, "opencode", "opencode.db"), "")
    mkdirSync(join(dataHome, "opencode", "storage"), { recursive: true })
    writeFileSync(join(dataHome, "opencode", "storage", "project.json"), "{}")

    expect(sqliteFileExists(dataHome)).toBe(true)
    expect(legacyJsonStorageExists(dataHome)).toBe(true)
    expect(shouldRunJsonMigration(dataHome)).toBe(false)
  })

  test("legacy JSON storage without sqlite runs migration", () => {
    const dataHome = tempDataHome()
    mkdirSync(join(dataHome, "opencode", "storage"), { recursive: true })
    writeFileSync(join(dataHome, "opencode", "storage", "project.json"), "{}")

    expect(sqliteFileExists(dataHome)).toBe(false)
    expect(legacyJsonStorageExists(dataHome)).toBe(true)
    expect(shouldRunJsonMigration(dataHome)).toBe(true)
  })
})
