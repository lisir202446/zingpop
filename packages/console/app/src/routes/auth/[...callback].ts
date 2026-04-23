import { redirect } from "@solidjs/router"
import type { APIEvent } from "@solidjs/start/server"

export async function GET(_input: APIEvent) {
  return redirect("/auth/phone")
}
