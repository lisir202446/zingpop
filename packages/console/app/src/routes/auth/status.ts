import { APIEvent } from "@solidjs/start"
import { useAuthSession } from "~/context/auth"

export async function GET(_input: APIEvent) {
  const session = await useAuthSession()
  const current = session.data.current ? session.data.account?.[session.data.current] : undefined
  const fallback = Object.values(session.data.account ?? {})[0]
  const account = current ?? fallback
  if (!account) return Response.json({ authenticated: false }, { status: 401 })
  return Response.json({
    authenticated: true,
    account: {
      id: account.id,
      login: account.login,
      phone: account.phone,
    },
  })
}
