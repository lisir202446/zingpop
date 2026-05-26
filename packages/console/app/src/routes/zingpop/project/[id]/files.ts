import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { badRequest, requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export async function POST(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) return unauthorized()
  const project = await WorkbenchProject.get({ workspaceID: access.workspaceID, projectID: input.params.id })
  if (!project) return unauthorized()
  const body = (await input.request.json().catch(() => ({}))) as { files?: WorkbenchProject.UploadFile[] }
  if (!Array.isArray(body.files)) return badRequest("Missing files")
  try {
    await WorkbenchProject.uploadFiles({ directory: project.directory, files: body.files })
    return Response.json({ ok: true })
  } catch (error) {
    return badRequest(error)
  }
}
