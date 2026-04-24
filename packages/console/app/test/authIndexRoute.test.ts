import { describe, expect, test } from "bun:test"
import { authIndexRedirectLocation, isAuthIndexPath } from "../src/lib/auth-index"

describe("auth index route", () => {
  test("matches only the exact auth path", () => {
    expect(isAuthIndexPath("/auth")).toBe(true)
    expect(isAuthIndexPath("/zh/auth")).toBe(true)
    expect(isAuthIndexPath("/auth/phone")).toBe(false)
    expect(isAuthIndexPath("/zh/auth/phone")).toBe(false)
  })

  test("redirects auth index requests to phone auth and preserves search", () => {
    expect(authIndexRedirectLocation(new Request("https://example.com/auth"))).toBe("/auth/phone")
    expect(authIndexRedirectLocation(new Request("https://example.com/zh/auth?continue=%2Fworkspace%2F123"))).toBe(
      "/auth/phone?continue=%2Fworkspace%2F123",
    )
  })
})
