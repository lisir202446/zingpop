import { redirect } from "@solidjs/router"
import type { APIEvent } from "@solidjs/start/server"
import { getLastSeenWorkspaceID } from "../workspace/common"
import { authIndexRedirectLocation, isAuthIndexPath } from "~/lib/auth-index"
import { localeFromRequest, route } from "~/lib/language"

export async function GET(input: APIEvent) {
  if (!isAuthIndexPath(new URL(input.request.url).pathname)) return
  const locale = localeFromRequest(input.request)
  try {
    const workspaceID = await getLastSeenWorkspaceID()
    if (workspaceID) return redirect(route(locale, `/workspace/${workspaceID}/home`))
  } catch {
    return redirect(authIndexRedirectLocation(input.request))
  }
  return redirect(authIndexRedirectLocation(input.request))
}
