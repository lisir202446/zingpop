import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { auditError, auditRequest } from "~/lib/audit-log"
import { badRequest, requireWorkbenchAccess, unauthorized } from "~/lib/zingpop-project-auth"

export async function POST(input: APIEvent) {
  const access = await requireWorkbenchAccess()
  if (!access) {
    auditRequest({ event: "workbench.project.create.git", request: input.request, status: "denied" })
    return unauthorized()
  }
  const body = (await input.request.json().catch(() => ({}))) as { url?: string; branch?: string; name?: string }
  if (!body.url) {
    auditRequest({
      event: "workbench.project.create.git",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      status: "failure",
      detail: "Missing Git URL",
    })
    return badRequest("Missing Git URL")
  }
  try {
    const git = WorkbenchProject.validateGitImport({ url: body.url, branch: body.branch })
    const project = await WorkbenchProject.create({
      workspaceID: access.workspaceID,
      name: body.name?.trim() || new URL(git.url).pathname.split("/").filter(Boolean).at(-1)?.replace(/\.git$/, "") || "Git 项目",
      sourceType: "git_public",
      sourceLabel: git.url,
    })
    await WorkbenchProject.cloneGit({ directory: project.directory, url: git.url, branch: git.branch })
    auditRequest({
      event: "workbench.project.create.git",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      projectID: project.id,
      status: "success",
      detail: new URL(git.url).hostname,
    })
    return Response.json({ project: WorkbenchProject.opencodeProject(project) })
  } catch (error) {
    auditRequest({
      event: "workbench.project.create.git",
      request: input.request,
      accountID: access.accountID,
      workspaceID: access.workspaceID,
      status: "failure",
      detail: auditError(error),
    })
    return badRequest(error)
  }
}
