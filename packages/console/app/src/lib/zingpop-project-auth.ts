import { Workbench } from "@opencode-ai/console-core/workbench.js"
import { useAuthSession } from "~/context/auth"

export async function requireWorkbenchAccess(originalURI?: string) {
  const session = await useAuthSession()
  const current = session.data.current ? session.data.account?.[session.data.current] : undefined
  const account = current ?? Object.values(session.data.account ?? {})[0]
  if (!account) return
  return Workbench.resolveAccess({ accountID: account.id, originalURI })
}

export function unauthorized() {
  return Response.json({ authenticated: false }, { status: 401 })
}

export function badRequest(error: unknown) {
  return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 })
}
