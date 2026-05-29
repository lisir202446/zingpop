import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { auditRequest } from "~/lib/audit-log"
import { badRequest, requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export async function PATCH(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) {
    auditRequest({ event: "workbench.project.rename", request: input.request, projectID: input.params.id, status: "denied" })
    return unauthorized()
  }
  const project = await WorkbenchProject.get({ workspaceID: access.workspaceID, projectID: input.params.id })
  if (!project) {
    auditRequest({
      event: "workbench.project.rename",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: input.params.id,
      status: "denied",
    })
    return unauthorized()
  }
  const body = (await input.request.json().catch(() => ({}))) as { name?: string }
  if (typeof body.name !== "string") return badRequest("Missing project name")
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

export async function DELETE(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) {
    auditRequest({ event: "workbench.project.delete", request: input.request, projectID: input.params.id, status: "denied" })
    return unauthorized()
  }
  const project = await WorkbenchProject.get({ workspaceID: access.workspaceID, projectID: input.params.id })
  if (!project) {
    auditRequest({
      event: "workbench.project.delete",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: input.params.id,
      status: "denied",
    })
    return unauthorized()
  }
  await WorkbenchProject.remove({ workspaceID: access.workspaceID, projectID: project.id })
  auditRequest({
    event: "workbench.project.delete",
    request: input.request,
    accountID: access.accountID,
    workspaceID: access.workspaceID,
    projectID: project.id,
    status: "success",
  })
  return Response.json({ ok: true })
}
