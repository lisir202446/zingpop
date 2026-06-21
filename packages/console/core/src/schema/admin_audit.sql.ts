import { index, json, mysqlTable, primaryKey, varchar } from "drizzle-orm/mysql-core"
import { id, timestamps, ulid } from "../drizzle/types"
import { Identifier } from "../identifier"

export const AdminAuditTable = mysqlTable(
  "admin_audit",
  {
    auditID: id().$defaultFn(() => Identifier.create("adminAudit")),
    ...timestamps,
    adminAccountID: ulid("admin_account_id").notNull(),
    adminLogin: varchar("admin_login", { length: 255 }).notNull(),
    action: varchar("action", { length: 64 }).notNull(),
    targetType: varchar("target_type", { length: 32 }).notNull(),
    targetID: varchar("target_id", { length: 255 }).notNull(),
    workspaceID: ulid("workspace_id"),
    userID: ulid("user_id"),
    accountID: ulid("account_id"),
    reason: varchar("reason", { length: 512 }).notNull(),
    beforeSnapshot: json("before_snapshot").$type<Record<string, unknown> | null>(),
    afterSnapshot: json("after_snapshot").$type<Record<string, unknown> | null>(),
    requestMetadata: json("request_metadata").$type<Record<string, unknown> | null>(),
  },
  (table) => [
    primaryKey({ columns: [table.auditID] }),
    index("admin_account_id").on(table.adminAccountID),
    index("target").on(table.targetType, table.targetID),
    index("workspace_id").on(table.workspaceID),
  ],
)
