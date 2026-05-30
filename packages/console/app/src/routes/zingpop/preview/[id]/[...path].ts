import { WorkbenchProject } from "@opencode-ai/console-core/workbench-project.js"
import type { APIEvent } from "@solidjs/start"
import { auditError, auditRequest } from "~/lib/audit-log"
import { badRequest } from "~/lib/zingpop-project-auth"
import { escapeHTML, previewRoutePath, previewUrlPath, resolvePreviewRequest } from "~/lib/zingpop-project-preview"

const event = "workbench.project.preview"

export async function GET(input: APIEvent) {
  const resolved = await resolvePreviewRequest(input, event)
  if (resolved instanceof Response) return resolved

  const target = previewRoutePath(input.params.path)
  try {
    const type = WorkbenchProject.previewContentType({ path: target })
    if (type !== "text/html; charset=utf-8") return badRequest("Preview requires an HTML file")

    const file = `/_zingpop/preview-file/${encodeURIComponent(resolved.project.id)}/${previewUrlPath(target)}`
    auditRequest({
      event,
      request: input.request,
      accountID: resolved.access.accountID,
      workspaceID: resolved.access.workspaceID,
      projectID: resolved.project.id,
      status: "success",
    })
    return new Response(
      `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHTML(target)} - Zingpop 作品预览</title>
  <style>
    html,body{margin:0;width:100%;height:100%;background:#f8f8f8;color:#111;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    header{height:44px;display:flex;align-items:center;gap:12px;padding:0 14px;border-bottom:1px solid #ddd;background:#fff;box-sizing:border-box}
    strong{font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    iframe{display:block;width:100%;height:calc(100% - 44px);border:0;background:#fff}
  </style>
</head>
<body>
  <header><strong>${escapeHTML(target)}</strong></header>
  <iframe src="${escapeHTML(file)}" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads"></iframe>
</body>
</html>`,
      {
        headers: {
          "cache-control": "no-store",
          "content-security-policy": "frame-ancestors 'self'",
          "content-type": "text/html; charset=utf-8",
          "x-content-type-options": "nosniff",
        },
      },
    )
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
