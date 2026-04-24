import { describe, expect, test } from "bun:test"
import { rootRedirectLocation } from "../src/lib/root-redirect"

describe("root route", () => {
  test("redirects to phone auth", async () => {
    expect(rootRedirectLocation(new Request("https://example.com/"))).toBe("/auth/phone")
  })

  test("preserves search params when redirecting", async () => {
    expect(rootRedirectLocation(new Request("https://example.com/?continue=%2Fworkspace%2F123"))).toBe(
      "/auth/phone?continue=%2Fworkspace%2F123",
    )
  })
})
