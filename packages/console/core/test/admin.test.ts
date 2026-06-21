import { describe, expect, test } from "bun:test"
import { Admin } from "../src/admin"

describe("admin helpers", () => {
  test("parses stable lookup targets before falling back to text search", () => {
    expect(Admin.lookupTarget("acc_01")).toEqual({ kind: "account", value: "acc_01" })
    expect(Admin.lookupTarget("usr_01")).toEqual({ kind: "user", value: "usr_01" })
    expect(Admin.lookupTarget("wrk_01")).toEqual({ kind: "workspace", value: "wrk_01" })
    expect(Admin.lookupTarget("key_01")).toEqual({ kind: "key", value: "key_01" })
    expect(Admin.lookupTarget("  owner@example.com  ")).toEqual({ kind: "text", value: "owner@example.com" })
  })

  test("requires meaningful reasons for admin mutations", () => {
    expect(Admin.normalizeReason(" billing correction ")).toBe("billing correction")
    expect(() => Admin.normalizeReason("fix")).toThrow("Admin operation reason must be at least 6 characters")
    expect(() => Admin.normalizeReason("      ")).toThrow("Admin operation reason must be at least 6 characters")
  })

  test("summarizes overview rows for active and deleted records", () => {
    expect(
      Admin.summarizeOverview({
        accounts: 3,
        memberships: [
          { deleted: false },
          { deleted: true },
          { deleted: false },
        ],
        workspaces: [
          { deleted: false, balance: 100, black: true, lite: false },
          { deleted: true, balance: -50, black: false, lite: true },
        ],
        recentUsageCost: 25,
      }),
    ).toEqual({
      accounts: 3,
      activeUsers: 2,
      deletedUsers: 1,
      activeWorkspaces: 1,
      deletedWorkspaces: 1,
      activeBlackSubscriptions: 1,
      activeLiteSubscriptions: 1,
      totalBalance: 50,
      recentUsageCost: 25,
    })
  })

  test("ships the admin audit database migration", async () => {
    const source = await Bun.file(new URL("../migrations/20260619090000_admin_audit/migration.sql", import.meta.url)).text()

    expect(source).toContain("CREATE TABLE `admin_audit`")
    expect(source).toContain("`admin_account_id` varchar(30) NOT NULL")
    expect(source).toContain("`before_snapshot` json")
    expect(source).toContain("CREATE INDEX `workspace_id` ON `admin_audit`")
  })
})
