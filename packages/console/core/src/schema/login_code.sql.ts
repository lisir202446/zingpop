import { index, int, mysqlTable, primaryKey, varchar } from "drizzle-orm/mysql-core"
import { id, timestamps, utc } from "../drizzle/types"

export const LoginCodeTable = mysqlTable(
  "login_code",
  {
    id: id(),
    ...timestamps,
    phone: varchar("phone", { length: 16 }).notNull(),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    expiresAt: utc("expires_at").notNull(),
    usedAt: utc("used_at"),
    attemptCount: int("attempt_count").notNull().default(0),
    ip: varchar("ip", { length: 64 }),
  },
  (table) => [
    primaryKey({ columns: [table.id] }),
    index("phone").on(table.phone),
    index("phone_created").on(table.phone, table.timeCreated),
  ],
)
