import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { auditError, auditRequest } from "~/lib/audit-log"
import { badRequest, requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export async function POST(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) {
    auditRequest({ event: "workbench.project.create.empty", request: input.request, status: "denied" })
    return unauthorized()
  }
  const body = (await input.request.json().catch(() => ({}))) as { name?: string }
  const name = body.name?.trim() || "新建项目"
  try {
    const project = await WorkbenchProject.create({
      workspaceID: access.workspaceID,
      name,
      sourceType: "empty",
      sourceLabel: name,
    })
    auditRequest({
      event: "workbench.project.create.empty",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: project.id,
      status: "success",
    })
    return Response.json({ project: WorkbenchProject.opencodeProject(project) })
  } catch (error) {
    auditRequest({
      event: "workbench.project.create.empty",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      status: "failure",
      detail: auditError(error),
    })
    return badRequest(error)
  }
}
