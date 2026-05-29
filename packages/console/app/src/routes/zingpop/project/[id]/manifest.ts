import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { auditError, auditRequest } from "~/lib/audit-log"
import { badRequest, requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export async function GET(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) {
    auditRequest({ event: "workbench.project.manifest", request: input.request, projectID: input.params.id, status: "denied" })
    return unauthorized()
  }
  const project = await WorkbenchProject.get({ workspaceID: access.workspaceID, projectID: input.params.id })
  if (!project) {
    auditRequest({
      event: "workbench.project.manifest",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: input.params.id,
      status: "denied",
    })
    return unauthorized()
  }
  try {
    const files = await WorkbenchProject.manifest({ directory: project.directory })
    auditRequest({
      event: "workbench.project.manifest",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: project.id,
      status: "success",
      count: files.length,
    })
    return Response.json({ files })
  } catch (error) {
    auditRequest({
      event: "workbench.project.manifest",
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
