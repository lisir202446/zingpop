import { action, json, query } from "@solidjs/router"
import { Admin } from "@opencode-ai/console-core/admin.js"
import { withActor } from "~/context/auth.withActor"
import { getRequestEvent } from "solid-js/web"
import { parseAdminAmount, parseAdminLimit, requireAdminField } from "./form"
import { AdminRouteResult, adminErrorMessage } from "./result"

function requestMetadata() {
  const request = getRequestEvent()?.request
  return {
    ip: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request?.headers.get("x-real-ip") ?? undefined,
    userAgent: request?.headers.get("user-agent") ?? undefined,
  }
}

async function withAdminQuery<T>(callback: () => Promise<T>): Promise<AdminRouteResult<T>> {
  "use server"
  return withActor(() =>
    callback()
      .then((data) => ({ data, error: undefined }))
      .catch((error) => ({ data: undefined, error: adminErrorMessage(error) })),
  )
}

async function withAdminResult(callback: () => Promise<unknown>) {
  "use server"
  return json(
    await withActor(() =>
      callback()
        .then((data) => ({ data, error: undefined }))
        .catch((error) => ({ data: undefined, error: adminErrorMessage(error) })),
    ),
    {
      revalidate: [adminOverview.key, adminSearch.key, adminAccountDetail.key, adminWorkspaceDetail.key],
    },
  )
}

export const adminOverview = query(async () => {
  "use server"
  return withAdminQuery(() => Admin.overview())
}, "admin.overview")

export const adminSearch = query(async (search: string) => {
  "use server"
  return withAdminQuery(() => Admin.search({ query: search }))
}, "admin.search")

export const adminAccountDetail = query(async (accountID: string) => {
  "use server"
  return withAdminQuery(() => Admin.accountDetail(accountID))
}, "admin.account.detail")

export const adminWorkspaceDetail = query(async (workspaceID: string) => {
  "use server"
  return withAdminQuery(() => Admin.workspaceDetail(workspaceID))
}, "admin.workspace.detail")

export const adjustWorkspaceBalance = action(async (form: FormData) => {
  "use server"
  return withAdminResult(() =>
    Admin.adjustWorkspaceBalance({
      workspaceID: requireAdminField(form, "workspaceID"),
      dollarAmount: parseAdminAmount(form.get("amount") as string | null),
      reason: requireAdminField(form, "reason"),
      request: requestMetadata(),
    }),
  )
}, "admin.workspace.balance.adjust")

export const setWorkspaceMonthlyLimit = action(async (form: FormData) => {
  "use server"
  return withAdminResult(() =>
    Admin.setWorkspaceMonthlyLimit({
      workspaceID: requireAdminField(form, "workspaceID"),
      monthlyLimit: parseAdminLimit(form.get("monthlyLimit") as string | null),
      reason: requireAdminField(form, "reason"),
      request: requestMetadata(),
    }),
  )
}, "admin.workspace.monthlyLimit")

export const setUserMonthlyLimit = action(async (form: FormData) => {
  "use server"
  return withAdminResult(() =>
    Admin.setUserMonthlyLimit({
      workspaceID: requireAdminField(form, "workspaceID"),
      userID: requireAdminField(form, "userID"),
      monthlyLimit: parseAdminLimit(form.get("monthlyLimit") as string | null),
      reason: requireAdminField(form, "reason"),
      request: requestMetadata(),
    }),
  )
}, "admin.user.monthlyLimit")

export const setUserDeleted = action(async (form: FormData) => {
  "use server"
  return withAdminResult(() =>
    Admin.setUserDeleted({
      workspaceID: requireAdminField(form, "workspaceID"),
      userID: requireAdminField(form, "userID"),
      deleted: requireAdminField(form, "deleted") === "true",
      reason: requireAdminField(form, "reason"),
      request: requestMetadata(),
    }),
  )
}, "admin.user.deleted")

export const setWorkspaceDeleted = action(async (form: FormData) => {
  "use server"
  return withAdminResult(() =>
    Admin.setWorkspaceDeleted({
      workspaceID: requireAdminField(form, "workspaceID"),
      deleted: requireAdminField(form, "deleted") === "true",
      reason: requireAdminField(form, "reason"),
      request: requestMetadata(),
    }),
  )
}, "admin.workspace.deleted")

export const disableWorkspaceReload = action(async (form: FormData) => {
  "use server"
  return withAdminResult(() =>
    Admin.disableReload({
      workspaceID: requireAdminField(form, "workspaceID"),
      reason: requireAdminField(form, "reason"),
      request: requestMetadata(),
    }),
  )
}, "admin.workspace.reload.disable")

export const cancelWorkspaceSubscription = action(async (form: FormData) => {
  "use server"
  return withAdminResult(() =>
    Admin.cancelSubscription({
      workspaceID: requireAdminField(form, "workspaceID"),
      subscription: requireAdminField(form, "subscription") === "lite" ? "lite" : "black",
      reason: requireAdminField(form, "reason"),
      request: requestMetadata(),
    }),
  )
}, "admin.workspace.subscription.cancel")
