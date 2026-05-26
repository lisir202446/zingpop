import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { badRequest, requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export async function POST(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) return unauthorized()
  const body = (await input.request.json().catch(() => ({}))) as { name?: string; sourceLabel?: string }
  const name = body.name?.trim() || body.sourceLabel?.trim() || "本机文件夹"
  try {
    const project = await WorkbenchProject.create({
      workspaceID: access.workspaceID,
      name,
      sourceType: "local_folder",
      sourceLabel: body.sourceLabel?.trim() || name,
    })
    return Response.json({ project: WorkbenchProject.opencodeProject(project) })
  } catch (error) {
    return badRequest(error)
  }
}
