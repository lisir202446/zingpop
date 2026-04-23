import { redirect } from "@solidjs/router"
import type { APIEvent } from "@solidjs/start/server"

export async function GET(input: APIEvent) {
  const url = new URL(input.request.url)
  const cont = url.searchParams.get("continue") ?? ""
  return redirect(cont ? `/auth/phone?continue=${encodeURIComponent(cont)}` : "/auth/phone")
}
