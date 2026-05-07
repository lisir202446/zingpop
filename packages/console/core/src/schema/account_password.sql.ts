import { int, mysqlTable, primaryKey, timestamp, varchar } from "drizzle-orm/mysql-core"
import { timestamps, ulid, utc } from "../drizzle/types"

export const AccountPasswordTable = mysqlTable(
  "account_password",
  {
    accountID: ulid("account_id").notNull(),
    ...timestamps,
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    passwordAlgorithm: varchar("password_algorithm", { length: 32 }).notNull(),
    timePasswordUpdated: utc("time_password_updated").notNull().defaultNow(),
    failedAttemptCount: int("failed_attempt_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { fsp: 3 }),
  },
  (table) => [primaryKey({ columns: [table.accountID] })],
)
