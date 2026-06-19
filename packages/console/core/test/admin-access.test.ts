import { describe, expect, test } from "bun:test"
import { Actor } from "../src/actor"
import { AdminAccess } from "../src/admin-access"

describe("admin access", () => {
  const env = {
    ZINGPOP_ADMIN_ACCOUNT_IDS: "acc_allowed",
    ZINGPOP_ADMIN_PHONES: "+15551234567",
    ZINGPOP_ADMIN_LOGINS: "owner@example.com",
  }

  test("allows explicitly configured account ids", () => {
    const allowed = Actor.provide(
      "account",
      {
        accountID: "acc_allowed",
        login: "other@example.com",
      },
      () => AdminAccess.allowed(env),
    )

    expect(allowed).toBe(true)
  })

  test("allows explicitly configured phone numbers", () => {
    const allowed = Actor.provide(
      "account",
      {
        accountID: "acc_other",
        login: "+15551234567",
        phone: "+15551234567",
      },
      () => AdminAccess.allowed(env),
    )

    expect(allowed).toBe(true)
  })

  test("allows explicitly configured logins", () => {
    const allowed = Actor.provide(
      "account",
      {
        accountID: "acc_other",
        login: "owner@example.com",
      },
      () => AdminAccess.allowed(env),
    )

    expect(allowed).toBe(true)
  })

  test("rejects public actors", () => {
    const allowed = Actor.provide("public", {}, () => AdminAccess.allowed(env))

    expect(allowed).toBe(false)
  })

  test("rejects workspace admins that are not globally allowlisted", () => {
    const allowed = Actor.provide(
      "user",
      {
        accountID: "acc_workspace_admin",
        role: "admin",
        userID: "usr_01",
        workspaceID: "wrk_01",
      },
      () => AdminAccess.allowed(env),
    )

    expect(allowed).toBe(false)
  })

  test("throws a stable authorization error for non-admin accounts", () => {
    expect(() =>
      Actor.provide(
        "account",
        {
          accountID: "acc_other",
          login: "member@example.com",
        },
        () => AdminAccess.assert(env),
      ),
    ).toThrow("Global admin access required")
  })
})
