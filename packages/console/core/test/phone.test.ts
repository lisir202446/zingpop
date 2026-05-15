import { describe, expect, test } from "bun:test"
import {
  LOGIN_CODE_ATTEMPT_LIMIT,
  assertCanSendCode,
  assertCodeUsable,
} from "../src/phone-auth"
import { AuthProvider } from "../src/schema/auth.sql"
import { Phone } from "../src/phone"
import { SMS } from "../src/sms"

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

  test("allows a development fallback when sms is not configured", () => {
    expect(
      SMS.allowDevelopmentFallback({
        stage: "development",
        env: {},
      }),
    ).toBe(true)
  })

  test("requires real sms configuration outside development fallback", () => {
    expect(
      SMS.allowDevelopmentFallback({
        stage: "production",
        env: {},
      }),
    ).toBe(false)
  })

  test("recognizes Huawei APIG marketplace sms configuration", () => {
    expect(
      SMS.isConfigured({
        SMS_PROVIDER: "huawei_apig",
        HUAWEI_APIG_SMS_URL: "https://cdcxsms.apistore.huaweicloud.com/chuangxinsms/dxjk",
        HUAWEI_APIG_APP_KEY: "test-key",
        HUAWEI_APIG_APP_SECRET: "test-secret",
        HUAWEI_APIG_SMS_CONTENT_TEMPLATE: "Your verification code is {code}",
      }),
    ).toBe(true)
  })

  test("sends Huawei APIG marketplace sms with signed query parameters", async () => {
    const previousFetch = globalThis.fetch
    const requests: Array<{
      url: string
      method?: string
      headers: Headers
    }> = []

    globalThis.fetch = Object.assign(
      async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        requests.push({
          url: input.toString(),
          method: init?.method,
          headers: new Headers(init?.headers as ConstructorParameters<typeof Headers>[0]),
        })

        return new Response(JSON.stringify({ code: "000000" }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        })
      },
      { preconnect: previousFetch.preconnect },
    )

    process.env.SMS_PROVIDER = "huawei_apig"
    process.env.HUAWEI_APIG_SMS_URL = "https://cdcxsms.apistore.huaweicloud.com/chuangxinsms/dxjk"
    process.env.HUAWEI_APIG_APP_KEY = "test-key"
    process.env.HUAWEI_APIG_APP_SECRET = "test-secret"
    process.env.HUAWEI_APIG_SMS_CONTENT_TEMPLATE = "Your verification code is {code}"

    try {
      await SMS.sendLoginCode({
        phone: "18122488704",
        code: "123456",
      })
    } finally {
      globalThis.fetch = previousFetch
      delete process.env.SMS_PROVIDER
      delete process.env.HUAWEI_APIG_SMS_URL
      delete process.env.HUAWEI_APIG_APP_KEY
      delete process.env.HUAWEI_APIG_APP_SECRET
      delete process.env.HUAWEI_APIG_SMS_CONTENT_TEMPLATE
    }

    const request = requests[0]
    const url = new URL(request.url)
    expect(request.method).toBe("POST")
    expect(`${url.origin}${url.pathname}`).toBe("https://cdcxsms.apistore.huaweicloud.com/chuangxinsms/dxjk")
    expect(url.searchParams.get("content")).toBe("Your verification code is 123456")
    expect(url.searchParams.get("mobile")).toBe("18122488704")
    expect(request.headers.get("x-stage")).toBe("RELEASE")
    expect(request.headers.get("authorization")).toContain("SDK-HMAC-SHA256 Access=test-key")
    expect(request.headers.get("authorization")).toContain("SignedHeaders=user-agent;x-sdk-date;x-stage")
  })
})
