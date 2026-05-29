type AuditValue = string | number | boolean | null | undefined

function compact(fields: Record<string, AuditValue>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== ""))
}

function clamp(value: string | undefined) {
  if (!value) return
  return value.length > 180 ? `${value.slice(0, 180)}...` : value
}

function requestFields(request: Request | undefined) {
  if (!request) return {}
  const url = new URL(request.url)
  return {
    method: request.method,
    path: url.pathname,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? undefined,
    userAgent: clamp(request.headers.get("user-agent") ?? undefined),
  }
}

export function auditError(error: unknown) {
  return clamp(error instanceof Error ? error.message : String(error))
}

export function auditLog(event: string, fields: Record<string, AuditValue> = {}) {
  console.info(
    `audit:${JSON.stringify({
      event,
      time: new Date().toISOString(),
      ...compact(fields),
    })}`,
  )
}

export function auditRequest(input: {
  event: string
  request?: Request
  accountID?: string
  workspaceID?: string
  projectID?: string
  status?: "success" | "failure" | "denied"
  detail?: string
  count?: number
}) {
  auditLog(input.event, {
    ...requestFields(input.request),
    accountID: input.accountID,
    workspaceID: input.workspaceID,
    projectID: input.projectID,
    status: input.status,
    detail: clamp(input.detail),
    count: input.count,
  })
}
