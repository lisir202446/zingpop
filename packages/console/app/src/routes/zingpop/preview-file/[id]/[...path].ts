import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { auditError, auditRequest } from "~/lib/audit-log"
import { badRequest } from "~/lib/zingpop-project-auth"
import { previewRoutePath, resolvePreviewRequest } from "~/lib/zingpop-project-preview"

const event = "workbench.project.preview"

export async function GET(input: APIEvent) {
  const resolved = await resolvePreviewRequest(input, event)
  if (resolved instanceof Response) return resolved

  const target = previewRoutePath(input.params.path)
  try {
    const contentType = WorkbenchProject.previewContentType({ path: target })
    if (!contentType) return badRequest("File cannot be previewed")

    const file = await WorkbenchProject.readPreviewFile({ directory: resolved.project.directory, path: target })
    auditRequest({
      event,
      request: input.request,
      accountID: resolved.access.accountID,
      workspaceID: resolved.access.workspaceID,
      projectID: resolved.project.id,
      status: "success",
    })
    return new Response(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer, {
      headers: {
        "cache-control": "no-store",
        ...(contentType === "text/html; charset=utf-8"
          ? { "content-security-policy": "sandbox allow-scripts allow-forms allow-modals allow-popups allow-downloads" }
          : {}),
        "content-type": contentType,
        "x-content-type-options": "nosniff",
      },
    })
  } catch (error) {
    auditRequest({
      event,
      request: input.request,
      accountID: resolved.access.accountID,
      workspaceID: resolved.access.workspaceID,
      projectID: resolved.project.id,
      status: "failure",
      detail: auditError(error),
    })
    return badRequest(error)
  }
}
