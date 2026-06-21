import { describe, expect, test } from "bun:test"
import { parseAdminAmount, parseAdminLimit, requireAdminField } from "../src/routes/admin/form"
import { adminErrorMessage, adminErrorTitle } from "../src/routes/admin/result"

describe("admin route helpers", () => {
  test("parses signed dollar adjustments", () => {
    expect(parseAdminAmount("12.50")).toBe(12.5)
    expect(parseAdminAmount("-3")).toBe(-3)
    expect(() => parseAdminAmount("0")).toThrow("Amount cannot be zero")
    expect(() => parseAdminAmount("abc")).toThrow("Amount must be a number")
  })

  test("parses nullable monthly limits", () => {
    expect(parseAdminLimit("42")).toBe(42)
    expect(parseAdminLimit("")).toBe(null)
    expect(parseAdminLimit(null)).toBe(null)
    expect(() => parseAdminLimit("42.5")).toThrow("Monthly limit must be a whole number")
    expect(() => parseAdminLimit("-1")).toThrow("Monthly limit cannot be negative")
  })

  test("requires admin form fields", () => {
    const form = new FormData()
    form.set("workspaceID", "wrk_01")

    expect(requireAdminField(form, "workspaceID")).toBe("wrk_01")
    expect(() => requireAdminField(form, "reason")).toThrow("Missing reason")
  })

  test("keeps admin access failures readable", () => {
    const message = adminErrorMessage(new Error("Global admin access required"))

    expect(message).toBe("Sign in with a Zingpop global admin account to use this backend.")
    expect(adminErrorTitle(message, "Workspace unavailable")).toBe("Admin access required")
    expect(adminErrorTitle("Database is unavailable", "Workspace unavailable")).toBe("Workspace unavailable")
    expect(adminErrorMessage(new Error("Database is unavailable"))).toBe("Database is unavailable")
  })
})
