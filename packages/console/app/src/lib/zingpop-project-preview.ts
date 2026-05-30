import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { auditRequest } from "~/lib/audit-log"
import { requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export function previewRoutePath(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join("/")
  if (typeof value === "string") return value
  return ""
}

export function previewUrlPath(value: string) {
  return WorkbenchProject.safeRelativePath(value).split("/").map(encodeURIComponent).join("/")
}

export function escapeHTML(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export async function resolvePreviewRequest(input: APIEvent, event: string) {
  const access = await requireWorkbenchAccess()
  if (!access) {
    auditRequest({ event, request: input.request, projectID: input.params.id, status: "denied" })
    return unauthorized()
  }

  const project = await WorkbenchProject.get({ workspaceID: access.workspaceID, projectID: input.params.id })
  if (!project) {
    auditRequest({
      event,
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: input.params.id,
      status: "denied",
    })
    return unauthorized()
  }

  return { access, project }
}
