import { describe, expect, test } from "bun:test"
import {
  PASSWORD_LOGIN_FAILURE_MESSAGE,
  PASSWORD_RESET_FAILURE_MESSAGE,
  PASSWORD_ATTEMPT_LIMIT,
  assertPasswordAllowed,
  createPasswordHash,
  verifyPasswordHash,
} from "../src/password-auth"

describe("phone password auth", () => {
  test("hashes and verifies passwords", async () => {
    const hash = await createPasswordHash("password123")
    expect(hash).toStartWith("scrypt-v1:")
    expect(await verifyPasswordHash("password123", hash)).toBe(true)
    expect(await verifyPasswordHash("wrong-password", hash)).toBe(false)
  })

  test("uses a fresh salt for each hash", async () => {
    const first = await createPasswordHash("password123")
    const second = await createPasswordHash("password123")
    expect(first).not.toBe(second)
  })

  test("rejects short passwords", () => {
    expect(() => assertPasswordAllowed("1234567")).toThrow("Password must be at least 8 characters")
  })

  test("tracks a finite password attempt limit", () => {
    expect(PASSWORD_ATTEMPT_LIMIT).toBe(5)
  })

  test("uses one public login failure message for bad phone, bad password, and lockout", () => {
    expect(PASSWORD_LOGIN_FAILURE_MESSAGE).toBe("Invalid phone number or password")
  })

  test("uses a generic public reset failure message", () => {
    expect(PASSWORD_RESET_FAILURE_MESSAGE).toBe("Unable to reset password")
  })
})
