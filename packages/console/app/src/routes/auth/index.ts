import { redirect } from "@solidjs/router"
import type { APIEvent } from "@solidjs/start/server"
import { getLastSeenWorkspaceID } from "../workspace/common"
import { localeFromRequest, route } from "~/lib/language"

export async function GET(input: APIEvent) {
  const locale = localeFromRequest(input.request)
  const next = new URL(input.request.url).search
  try {
    const workspaceID = await getLastSeenWorkspaceID()
    if (workspaceID) return redirect(route(locale, `/workspace/${workspaceID}`))
  } catch {
    return redirect(next ? `/auth/phone${next}` : "/auth/phone")
  }
  return redirect(next ? `/auth/phone${next}` : "/auth/phone")
}
