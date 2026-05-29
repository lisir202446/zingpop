import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { auditError, auditRequest } from "~/lib/audit-log"
import { badRequest, requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export async function POST(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) {
    auditRequest({ event: "workbench.project.files.upload", request: input.request, projectID: input.params.id, status: "denied" })
    return unauthorized()
  }
  const project = await WorkbenchProject.get({ workspaceID: access.workspaceID, projectID: input.params.id })
  if (!project) {
    auditRequest({
      event: "workbench.project.files.upload",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: input.params.id,
      status: "denied",
    })
    return unauthorized()
  }
  const body = (await input.request.json().catch(() => ({}))) as { files?: WorkbenchProject.UploadFile[] }
  if (!Array.isArray(body.files)) return badRequest("Missing files")
  try {
    await WorkbenchProject.uploadFiles({ directory: project.directory, files: body.files })
    auditRequest({
      event: "workbench.project.files.upload",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: project.id,
      status: "success",
      count: body.files.length,
    })
    return Response.json({ ok: true })
  } catch (error) {
    auditRequest({
      event: "workbench.project.files.upload",
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
