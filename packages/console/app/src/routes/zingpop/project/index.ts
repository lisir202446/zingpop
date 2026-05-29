import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { auditRequest } from "~/lib/audit-log"
import { badRequest, requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export async function GET(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) {
    auditRequest({ event: "workbench.project.list", request: input.request, status: "denied" })
    return unauthorized()
  }
  const projects = await WorkbenchProject.list({ workspaceID: access.workspaceID })
  auditRequest({
    event: "workbench.project.list",
    request: input.request,
    accountID: access.accountID,
    workspaceID: access.workspaceID,
    status: "success",
    count: projects.length,
  })
  return Response.json({ projects: projects.map(WorkbenchProject.opencodeProject) })
}

export async function PATCH(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) {
    auditRequest({ event: "workbench.project.rename", request: input.request, status: "denied" })
    return unauthorized()
  }
  const body = (await input.request.json().catch(() => ({}))) as { projectID?: string; name?: string }
  if (!body.projectID || typeof body.name !== "string") return badRequest("Missing projectID or name")
  const project = await WorkbenchProject.get({ workspaceID: access.workspaceID, projectID: body.projectID })
  if (!project) {
    auditRequest({
      event: "workbench.project.rename",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: body.projectID,
      status: "denied",
    })
    return unauthorized()
  }
  await WorkbenchProject.rename({ workspaceID: access.workspaceID, projectID: project.id, name: body.name.trim() || project.name })
  auditRequest({
    event: "workbench.project.rename",
    request: input.request,
    accountID: access.accountID,
    workspaceID: access.workspaceID,
    projectID: project.id,
    status: "success",
  })
  return Response.json({ project: WorkbenchProject.opencodeProject((await WorkbenchProject.get({ workspaceID: access.workspaceID, projectID: project.id }))!) })
}
