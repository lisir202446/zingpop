import { describe, expect, test } from "bun:test"
import {
  LOGIN_CODE_ATTEMPT_LIMIT,
  assertCanSendCode,
  assertCodeUsable,
} from "../src/phone-auth"
import { AuthProvider } from "../src/schema/auth.sql"
import { Phone } from "../src/phone"

describe("phone login", () => {
  test("supports phone auth provider", () => {
    expect(AuthProvider).toContain("phone")
  })

  test("normalizes mainland phone numbers", () => {
    expect(Phone.normalize("+86 138-0013-8000")).toBe("13800138000")
  })

  test("rejects invalid mainland phone numbers", () => {
    expect(() => Phone.normalize("10086")).toThrow("Invalid phone number")
  })

  test("masks normalized phone numbers", () => {
    expect(Phone.mask("13800138000")).toBe("138****8000")
  })

  test("rejects sending a second code within the cooldown window", () => {
    expect(() =>
      assertCanSendCode({
        latestSentAt: new Date("2026-04-23T10:00:00.000Z"),
        dailyCount: 1,
        now: new Date("2026-04-23T10:00:30.000Z"),
      }),
    ).toThrow("Please wait before requesting another verification code")
  })

  test("rejects expired verification codes", () => {
    expect(() =>
      assertCodeUsable({
        expiresAt: new Date("2026-04-23T10:00:00.000Z"),
        attemptCount: 0,
        now: new Date("2026-04-23T10:06:00.000Z"),
      }),
    ).toThrow("Verification code has expired")
  })

  test("rejects codes after too many invalid attempts", () => {
    expect(() =>
      assertCodeUsable({
        expiresAt: new Date("2026-04-23T10:10:00.000Z"),
        attemptCount: LOGIN_CODE_ATTEMPT_LIMIT,
        now: new Date("2026-04-23T10:06:00.000Z"),
      }),
    ).toThrow("Too many invalid verification attempts")
  })
})
