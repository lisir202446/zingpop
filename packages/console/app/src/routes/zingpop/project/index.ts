import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { badRequest, requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export async function GET() {
  const access = await requireWorkbenchAccess()
  if (!access) return unauthorized()
  const projects = await WorkbenchProject.list({ workspaceID: access.workspaceID })
  return Response.json({ projects: projects.map(WorkbenchProject.opencodeProject) })
}

export async function PATCH(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) return unauthorized()
  const body = (await input.request.json().catch(() => ({}))) as { projectID?: string; name?: string }
  if (!body.projectID || typeof body.name !== "string") return badRequest("Missing projectID or name")
  const project = await WorkbenchProject.get({ workspaceID: access.workspaceID, projectID: body.projectID })
  if (!project) return unauthorized()
  await WorkbenchProject.rename({ workspaceID: access.workspaceID, projectID: project.id, name: body.name.trim() || project.name })
  return Response.json({ project: WorkbenchProject.opencodeProject((await WorkbenchProject.get({ workspaceID: access.workspaceID, projectID: project.id }))!) })
}
