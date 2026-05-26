import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { badRequest, requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export async function POST(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) return unauthorized()
  const body = (await input.request.json().catch(() => ({}))) as { url?: string; branch?: string; name?: string }
  if (!body.url) return badRequest("Missing Git URL")
  try {
    const git = WorkbenchProject.validateGitImport({ url: body.url, branch: body.branch })
    const project = await WorkbenchProject.create({
      workspaceID: access.workspaceID,
      name: body.name?.trim() || new URL(git.url).pathname.split("/").filter(Boolean).at(-1)?.replace(/\.git$/, "") || "Git 项目",
      sourceType: "git_public",
      sourceLabel: git.url,
    })
    await WorkbenchProject.cloneGit({ directory: project.directory, url: git.url, branch: git.branch })
    return Response.json({ project: WorkbenchProject.opencodeProject(project) })
  } catch (error) {
    return badRequest(error)
  }
}
