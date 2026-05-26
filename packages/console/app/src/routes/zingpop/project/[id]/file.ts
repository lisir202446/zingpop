import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { badRequest, requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export async function GET(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) return unauthorized()
  const project = await WorkbenchProject.get({ workspaceID: access.workspaceID, projectID: input.params.id })
  if (!project) return unauthorized()
  const target = new URL(input.request.url).searchParams.get("path")
  if (!target) return badRequest("Missing path")
  try {
    return new Response(await (await WorkbenchProject.readFile({ directory: project.directory, path: target })).arrayBuffer(), {
      headers: { "content-type": "application/octet-stream" },
    })
  } catch (error) {
    return badRequest(error)
  }
}
