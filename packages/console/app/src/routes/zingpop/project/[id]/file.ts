import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { auditError, auditRequest } from "~/lib/audit-log"
import { badRequest, requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export async function GET(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) {
    auditRequest({ event: "workbench.project.file.read", request: input.request, projectID: input.params.id, status: "denied" })
    return unauthorized()
  }
  const project = await WorkbenchProject.get({ workspaceID: access.workspaceID, projectID: input.params.id })
  if (!project) {
    auditRequest({
      event: "workbench.project.file.read",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: input.params.id,
      status: "denied",
    })
    return unauthorized()
  }
  const target = new URL(input.request.url).searchParams.get("path")
  if (!target) return badRequest("Missing path")
  try {
    const file = await WorkbenchProject.readFile({ directory: project.directory, path: target })
    auditRequest({
      event: "workbench.project.file.read",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: project.id,
      status: "success",
    })
    return new Response(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer, {
      headers: { "content-type": "application/octet-stream" },
    })
  } catch (error) {
    auditRequest({
      event: "workbench.project.file.read",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: project.id,
      status: "failure",
      detail: auditError(error),
    })
    return badRequest(error)
  }
}
