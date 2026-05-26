import { mysqlEnum, mysqlTable, primaryKey, uniqueIndex, varchar } from "drizzle-orm/mysql-core"
import { timestamps, ulid } from "../drizzle/types"

export const WorkbenchProjectSourceType = ["local_folder", "git_public", "empty"] as const
export const WorkbenchProjectSyncMode = ["manual", "auto"] as const

export const WorkbenchProjectTable = mysqlTable(
  "workbench_project",
  {
    workspace_id: ulid("workspace_id").notNull(),
    id: ulid("id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    source_type: mysqlEnum("source_type", WorkbenchProjectSourceType).notNull(),
    source_label: varchar("source_label", { length: 2048 }).notNull(),
    directory: varchar("directory", { length: 512 }).notNull(),
    sync_mode: mysqlEnum("sync_mode", WorkbenchProjectSyncMode).notNull().default("manual"),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.workspace_id, table.id] }),
    uniqueIndex("workbench_project_directory").on(table.workspace_id, table.directory),
  ],
)
