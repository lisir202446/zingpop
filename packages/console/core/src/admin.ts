import { and, Database, desc, eq, inArray, like, or, sql } from "./drizzle"
import { Actor } from "./actor"
import { AdminAccess } from "./admin-access"
import { Identifier } from "./identifier"
import { AccountTable } from "./schema/account.sql"
import { AdminAuditTable } from "./schema/admin_audit.sql"
import { AuthTable } from "./schema/auth.sql"
import { BillingTable, PaymentTable, UsageTable } from "./schema/billing.sql"
import { KeyTable } from "./schema/key.sql"
import { UserTable } from "./schema/user.sql"
import { WorkbenchProjectTable } from "./schema/workbench_project.sql"
import { WorkspaceTable } from "./schema/workspace.sql"
import { centsToMicroCents } from "./util/price"

export namespace Admin {
  export type LookupTarget =
    | { kind: "account"; value: string }
    | { kind: "user"; value: string }
    | { kind: "workspace"; value: string }
    | { kind: "key"; value: string }
    | { kind: "text"; value: string }

  export interface OverviewInput {
    accounts: number
    memberships: { deleted: boolean }[]
    workspaces: {
      deleted: boolean
      balance: number
      black: boolean
      lite: boolean
    }[]
    recentUsageCost: number
  }

  export interface OperationRequest {
    ip?: string
    userAgent?: string
  }

  export function lookupTarget(value: string): LookupTarget {
    const trimmed = value.trim()
    if (trimmed.startsWith("acc_")) return { kind: "account", value: trimmed }
    if (trimmed.startsWith("usr_")) return { kind: "user", value: trimmed }
    if (trimmed.startsWith("wrk_")) return { kind: "workspace", value: trimmed }
    if (trimmed.startsWith("key_")) return { kind: "key", value: trimmed }
    return { kind: "text", value: trimmed }
  }

  export function normalizeReason(reason: string) {
    const trimmed = reason.trim()
    if (trimmed.length >= 6) return trimmed
    throw new Error("Admin operation reason must be at least 6 characters")
  }

  export function summarizeOverview(input: OverviewInput) {
    return {
      accounts: input.accounts,
      activeUsers: input.memberships.filter((item) => !item.deleted).length,
      deletedUsers: input.memberships.filter((item) => item.deleted).length,
      activeWorkspaces: input.workspaces.filter((item) => !item.deleted).length,
      deletedWorkspaces: input.workspaces.filter((item) => item.deleted).length,
      activeBlackSubscriptions: input.workspaces.filter((item) => item.black).length,
      activeLiteSubscriptions: input.workspaces.filter((item) => item.lite).length,
      totalBalance: input.workspaces.reduce((sum, item) => sum + item.balance, 0),
      recentUsageCost: input.recentUsageCost,
    }
  }

  function assertAccess() {
    return AdminAccess.assert()
  }

  async function writeAudit(
    tx: Database.TxOrDb,
    input: {
      action: string
      targetType: string
      targetID: string
      reason: string
      workspaceID?: string | null
      userID?: string | null
      accountID?: string | null
      before?: Record<string, unknown> | null
      after?: Record<string, unknown> | null
      request?: OperationRequest
    },
  ) {
    const actor = Actor.assert("account")
    await tx.insert(AdminAuditTable).values({
      adminAccountID: actor.properties.accountID,
      adminLogin: actor.properties.login,
      action: input.action,
      targetType: input.targetType,
      targetID: input.targetID,
      workspaceID: input.workspaceID,
      userID: input.userID,
      accountID: input.accountID,
      reason: input.reason,
      beforeSnapshot: input.before ?? null,
      afterSnapshot: input.after ?? null,
      requestMetadata: input.request ? { ...input.request } : null,
    })
  }

  export async function overview() {
    assertAccess()
    const rows = await Database.use(async (tx) => {
      const accounts = await tx.select({ id: AccountTable.id }).from(AccountTable)
      const memberships = await tx.select({ timeDeleted: UserTable.timeDeleted }).from(UserTable)
      const workspaces = await tx
        .select({
          timeDeleted: WorkspaceTable.timeDeleted,
          balance: BillingTable.balance,
          blackSubscriptionID: BillingTable.subscriptionID,
          liteSubscriptionID: BillingTable.liteSubscriptionID,
        })
        .from(WorkspaceTable)
        .leftJoin(BillingTable, eq(BillingTable.workspaceID, WorkspaceTable.id))
      const usage = await tx
        .select({
          cost: UsageTable.cost,
        })
        .from(UsageTable)
        .orderBy(desc(UsageTable.timeCreated))
        .limit(500)

      return {
        accounts: accounts.length,
        memberships: memberships.map((item) => ({ deleted: Boolean(item.timeDeleted) })),
        workspaces: workspaces.map((item) => ({
          deleted: Boolean(item.timeDeleted),
          balance: item.balance ?? 0,
          black: Boolean(item.blackSubscriptionID),
          lite: Boolean(item.liteSubscriptionID),
        })),
        recentUsageCost: usage.reduce((sum, item) => sum + item.cost, 0),
      }
    })

    return summarizeOverview(rows)
  }

  export async function search(input: { query?: string; limit?: number }) {
    assertAccess()
    const query = (input.query ?? "").trim()
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100)

    if (!query) return []

    const target = lookupTarget(query)
    return Database.use((tx) =>
      tx
        .select({
          accountID: UserTable.accountID,
          userID: UserTable.id,
          userDeleted: UserTable.timeDeleted,
          userName: UserTable.name,
          role: UserTable.role,
          workspaceID: WorkspaceTable.id,
          workspaceName: WorkspaceTable.name,
          workspaceDeleted: WorkspaceTable.timeDeleted,
          authProvider: AuthTable.provider,
          authSubject: AuthTable.subject,
          balance: BillingTable.balance,
          blackSubscriptionID: BillingTable.subscriptionID,
          liteSubscriptionID: BillingTable.liteSubscriptionID,
        })
        .from(UserTable)
        .innerJoin(WorkspaceTable, eq(WorkspaceTable.id, UserTable.workspaceID))
        .leftJoin(AuthTable, eq(AuthTable.accountID, UserTable.accountID))
        .leftJoin(BillingTable, eq(BillingTable.workspaceID, WorkspaceTable.id))
        .where(
          target.kind === "account"
            ? eq(UserTable.accountID, target.value)
            : target.kind === "user"
              ? eq(UserTable.id, target.value)
              : target.kind === "workspace"
                ? eq(UserTable.workspaceID, target.value)
                : target.kind === "key"
                  ? sql`${UserTable.workspaceID} in (select workspace_id from ${KeyTable} where id = ${target.value})`
                  : or(
                      like(AuthTable.subject, `%${target.value}%`),
                      like(UserTable.email, `%${target.value}%`),
                      like(WorkspaceTable.name, `%${target.value}%`),
                      like(WorkspaceTable.slug, `%${target.value}%`),
                    ),
        )
        .orderBy(desc(UserTable.timeUpdated))
        .limit(limit),
    )
  }

  export async function accountDetail(accountID: string) {
    assertAccess()
    return Database.use(async (tx) => {
      const account = await tx
        .select()
        .from(AccountTable)
        .where(eq(AccountTable.id, accountID))
        .limit(1)
        .then((rows) => rows[0])
      if (!account) throw new Error("Account not found")

      const auth = await tx.select().from(AuthTable).where(eq(AuthTable.accountID, accountID))
      const memberships = await tx
        .select({
          user: UserTable,
          workspace: WorkspaceTable,
          billing: BillingTable,
        })
        .from(UserTable)
        .innerJoin(WorkspaceTable, eq(WorkspaceTable.id, UserTable.workspaceID))
        .leftJoin(BillingTable, eq(BillingTable.workspaceID, WorkspaceTable.id))
        .where(eq(UserTable.accountID, accountID))
        .orderBy(desc(UserTable.timeUpdated))

      const workspaceIDs = memberships.map((item) => item.workspace.id)
      const payments = workspaceIDs.length
        ? await tx
            .select()
            .from(PaymentTable)
            .where(inArray(PaymentTable.workspaceID, workspaceIDs))
            .orderBy(desc(PaymentTable.timeCreated))
            .limit(50)
        : []
      const usage = workspaceIDs.length
        ? await tx
            .select()
            .from(UsageTable)
            .where(inArray(UsageTable.workspaceID, workspaceIDs))
            .orderBy(desc(UsageTable.timeCreated))
            .limit(100)
        : []
      const keys = workspaceIDs.length
        ? await tx
            .select()
            .from(KeyTable)
            .where(inArray(KeyTable.workspaceID, workspaceIDs))
            .orderBy(desc(KeyTable.timeCreated))
            .limit(100)
        : []
      const projects = workspaceIDs.length
        ? await tx
            .select()
            .from(WorkbenchProjectTable)
            .where(inArray(WorkbenchProjectTable.workspace_id, workspaceIDs))
            .orderBy(desc(WorkbenchProjectTable.timeUpdated))
            .limit(100)
        : []
      const audits = await tx
        .select()
        .from(AdminAuditTable)
        .where(eq(AdminAuditTable.accountID, accountID))
        .orderBy(desc(AdminAuditTable.timeCreated))
        .limit(100)

      return {
        account,
        auth,
        memberships,
        payments,
        usage,
        keys,
        projects,
        audits,
      }
    })
  }

  export async function workspaceDetail(workspaceID: string) {
    assertAccess()
    return Database.use(async (tx) => {
      const workspace = await tx
        .select()
        .from(WorkspaceTable)
        .where(eq(WorkspaceTable.id, workspaceID))
        .limit(1)
        .then((rows) => rows[0])
      if (!workspace) throw new Error("Workspace not found")

      const users = await tx
        .select({
          user: UserTable,
          phone: AuthTable.subject,
        })
        .from(UserTable)
        .leftJoin(AuthTable, and(eq(AuthTable.accountID, UserTable.accountID), eq(AuthTable.provider, "phone")))
        .where(eq(UserTable.workspaceID, workspaceID))
        .orderBy(desc(UserTable.timeUpdated))
      const billing = await tx.select().from(BillingTable).where(eq(BillingTable.workspaceID, workspaceID)).limit(1)
      const payments = await tx
        .select()
        .from(PaymentTable)
        .where(eq(PaymentTable.workspaceID, workspaceID))
        .orderBy(desc(PaymentTable.timeCreated))
        .limit(100)
      const usage = await tx
        .select()
        .from(UsageTable)
        .where(eq(UsageTable.workspaceID, workspaceID))
        .orderBy(desc(UsageTable.timeCreated))
        .limit(100)
      const keys = await tx
        .select()
        .from(KeyTable)
        .where(eq(KeyTable.workspaceID, workspaceID))
        .orderBy(desc(KeyTable.timeCreated))
        .limit(100)
      const projects = await tx
        .select()
        .from(WorkbenchProjectTable)
        .where(eq(WorkbenchProjectTable.workspace_id, workspaceID))
        .orderBy(desc(WorkbenchProjectTable.timeUpdated))
        .limit(100)
      const audits = await tx
        .select()
        .from(AdminAuditTable)
        .where(eq(AdminAuditTable.workspaceID, workspaceID))
        .orderBy(desc(AdminAuditTable.timeCreated))
        .limit(100)

      return {
        workspace,
        users,
        billing: billing[0],
        payments,
        usage,
        keys,
        projects,
        audits,
      }
    })
  }

  export async function adjustWorkspaceBalance(input: {
    workspaceID: string
    dollarAmount: number
    reason: string
    request?: OperationRequest
  }) {
    assertAccess()
    const reason = normalizeReason(input.reason)
    const amount = centsToMicroCents(input.dollarAmount * 100)

    return Database.transaction(async (tx) => {
      const before = await tx
        .select()
        .from(BillingTable)
        .where(eq(BillingTable.workspaceID, input.workspaceID))
        .limit(1)
        .then((rows) => rows[0])
      if (!before) throw new Error("Billing record not found")

      await tx
        .update(BillingTable)
        .set({ balance: sql`${BillingTable.balance} + ${amount}` })
        .where(eq(BillingTable.workspaceID, input.workspaceID))
      await tx.insert(PaymentTable).values({
        workspaceID: input.workspaceID,
        id: Identifier.create("payment"),
        amount,
        status: amount >= 0 ? "paid" : "refunded",
        enrichment: {
          type: "credit",
        },
      })

      const after = await tx
        .select()
        .from(BillingTable)
        .where(eq(BillingTable.workspaceID, input.workspaceID))
        .limit(1)
        .then((rows) => rows[0])

      await writeAudit(tx, {
        action: "workspace.balance.adjust",
        targetType: "workspace",
        targetID: input.workspaceID,
        workspaceID: input.workspaceID,
        reason,
        before,
        after,
        request: input.request,
      })
    })
  }

  export async function setWorkspaceMonthlyLimit(input: {
    workspaceID: string
    monthlyLimit: number | null
    reason: string
    request?: OperationRequest
  }) {
    assertAccess()
    const reason = normalizeReason(input.reason)

    return Database.transaction(async (tx) => {
      const before = await tx
        .select()
        .from(BillingTable)
        .where(eq(BillingTable.workspaceID, input.workspaceID))
        .limit(1)
        .then((rows) => rows[0])
      if (!before) throw new Error("Billing record not found")

      await tx
        .update(BillingTable)
        .set({ monthlyLimit: input.monthlyLimit })
        .where(eq(BillingTable.workspaceID, input.workspaceID))

      await writeAudit(tx, {
        action: "workspace.monthly_limit.set",
        targetType: "workspace",
        targetID: input.workspaceID,
        workspaceID: input.workspaceID,
        reason,
        before,
        after: { ...before, monthlyLimit: input.monthlyLimit },
        request: input.request,
      })
    })
  }

  export async function setUserMonthlyLimit(input: {
    workspaceID: string
    userID: string
    monthlyLimit: number | null
    reason: string
    request?: OperationRequest
  }) {
    assertAccess()
    const reason = normalizeReason(input.reason)

    return Database.transaction(async (tx) => {
      const before = await tx
        .select()
        .from(UserTable)
        .where(and(eq(UserTable.workspaceID, input.workspaceID), eq(UserTable.id, input.userID)))
        .limit(1)
        .then((rows) => rows[0])
      if (!before) throw new Error("User not found")

      await tx
        .update(UserTable)
        .set({ monthlyLimit: input.monthlyLimit })
        .where(and(eq(UserTable.workspaceID, input.workspaceID), eq(UserTable.id, input.userID)))

      await writeAudit(tx, {
        action: "user.monthly_limit.set",
        targetType: "user",
        targetID: input.userID,
        workspaceID: input.workspaceID,
        userID: input.userID,
        accountID: before.accountID,
        reason,
        before,
        after: { ...before, monthlyLimit: input.monthlyLimit },
        request: input.request,
      })
    })
  }

  export async function setUserDeleted(input: {
    workspaceID: string
    userID: string
    deleted: boolean
    reason: string
    request?: OperationRequest
  }) {
    assertAccess()
    const reason = normalizeReason(input.reason)

    return Database.transaction(async (tx) => {
      const before = await tx
        .select()
        .from(UserTable)
        .where(and(eq(UserTable.workspaceID, input.workspaceID), eq(UserTable.id, input.userID)))
        .limit(1)
        .then((rows) => rows[0])
      if (!before) throw new Error("User not found")

      await tx
        .update(UserTable)
        .set({ timeDeleted: input.deleted ? sql`now()` : null })
        .where(and(eq(UserTable.workspaceID, input.workspaceID), eq(UserTable.id, input.userID)))
      const after = await tx
        .select()
        .from(UserTable)
        .where(and(eq(UserTable.workspaceID, input.workspaceID), eq(UserTable.id, input.userID)))
        .limit(1)
        .then((rows) => rows[0])

      await writeAudit(tx, {
        action: input.deleted ? "user.delete" : "user.restore",
        targetType: "user",
        targetID: input.userID,
        workspaceID: input.workspaceID,
        userID: input.userID,
        accountID: before.accountID,
        reason,
        before,
        after,
        request: input.request,
      })
    })
  }

  export async function setWorkspaceDeleted(input: {
    workspaceID: string
    deleted: boolean
    reason: string
    request?: OperationRequest
  }) {
    assertAccess()
    const reason = normalizeReason(input.reason)

    return Database.transaction(async (tx) => {
      const before = await tx
        .select()
        .from(WorkspaceTable)
        .where(eq(WorkspaceTable.id, input.workspaceID))
        .limit(1)
        .then((rows) => rows[0])
      if (!before) throw new Error("Workspace not found")

      await tx
        .update(WorkspaceTable)
        .set({ timeDeleted: input.deleted ? sql`now()` : null })
        .where(eq(WorkspaceTable.id, input.workspaceID))
      const after = await tx
        .select()
        .from(WorkspaceTable)
        .where(eq(WorkspaceTable.id, input.workspaceID))
        .limit(1)
        .then((rows) => rows[0])

      await writeAudit(tx, {
        action: input.deleted ? "workspace.delete" : "workspace.restore",
        targetType: "workspace",
        targetID: input.workspaceID,
        workspaceID: input.workspaceID,
        reason,
        before,
        after,
        request: input.request,
      })
    })
  }

  export async function disableReload(input: { workspaceID: string; reason: string; request?: OperationRequest }) {
    assertAccess()
    const reason = normalizeReason(input.reason)

    return Database.transaction(async (tx) => {
      const before = await tx
        .select()
        .from(BillingTable)
        .where(eq(BillingTable.workspaceID, input.workspaceID))
        .limit(1)
        .then((rows) => rows[0])
      if (!before) throw new Error("Billing record not found")

      await tx.update(BillingTable).set({ reload: false }).where(eq(BillingTable.workspaceID, input.workspaceID))

      await writeAudit(tx, {
        action: "workspace.reload.disable",
        targetType: "workspace",
        targetID: input.workspaceID,
        workspaceID: input.workspaceID,
        reason,
        before,
        after: { ...before, reload: false },
        request: input.request,
      })
    })
  }

  export async function cancelSubscription(input: {
    workspaceID: string
    subscription: "black" | "lite"
    reason: string
    request?: OperationRequest
  }) {
    assertAccess()
    const reason = normalizeReason(input.reason)

    return Database.transaction(async (tx) => {
      const before = await tx
        .select()
        .from(BillingTable)
        .where(eq(BillingTable.workspaceID, input.workspaceID))
        .limit(1)
        .then((rows) => rows[0])
      if (!before) throw new Error("Billing record not found")

      await tx
        .update(BillingTable)
        .set(
          input.subscription === "black"
            ? { subscriptionID: null, subscription: null }
            : { liteSubscriptionID: null, lite: null },
        )
        .where(eq(BillingTable.workspaceID, input.workspaceID))

      const after = await tx
        .select()
        .from(BillingTable)
        .where(eq(BillingTable.workspaceID, input.workspaceID))
        .limit(1)
        .then((rows) => rows[0])

      await writeAudit(tx, {
        action: input.subscription === "black" ? "workspace.black.cancel" : "workspace.lite.cancel",
        targetType: "workspace",
        targetID: input.workspaceID,
        workspaceID: input.workspaceID,
        reason,
        before,
        after,
        request: input.request,
      })
    })
  }
}
