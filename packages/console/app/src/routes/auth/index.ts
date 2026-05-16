import { redirect } from "@solidjs/router"
import type { APIEvent } from "@solidjs/start/server"
import { getLastSeenWorkspaceID } from "../workspace/common"
import { authIndexRedirectLocation, isAuthIndexPath } from "~/lib/auth-index"
import { authSuccessRedirectLocation } from "~/lib/workbench-redirect"

export async function GET(input: APIEvent) {
  if (!isAuthIndexPath(new URL(input.request.url).pathname)) return
  try {
    const workspaceID = await getLastSeenWorkspaceID()
    if (workspaceID) return redirect(authSuccessRedirectLocation(input.request, "", `/workspace/${workspaceID}/home`))
  } catch {
    return redirect(authIndexRedirectLocation(input.request))
  }
  return redirect(authIndexRedirectLocation(input.request))
}
