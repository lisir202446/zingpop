import { APIEvent } from "@solidjs/start"
import { Workbench } from "@opencode-ai/console-core/workbench.js"
import { useAuthSession } from "~/context/auth"

export async function GET(input: APIEvent) {
  const session = await useAuthSession()
  const current = session.data.current ? session.data.account?.[session.data.current] : undefined
  const fallback = Object.values(session.data.account ?? {})[0]
  const account = current ?? fallback
  if (!account) return Response.json({ authenticated: false }, { status: 401 })
  const access = await Workbench.resolveAccess({ accountID: account.id })
  if (!access) return Response.json({ authenticated: false }, { status: 403 })
  await Workbench.ensureDirectory(access)
  if (
    !(await Workbench.authorizeOriginalURI({
      originalURI: input.request.headers.get("x-original-uri") ?? undefined,
      method: input.request.headers.get("x-original-method") ?? undefined,
      access,
    }))
  ) {
    return Response.json({ authenticated: false }, { status: 403 })
  }

  return Response.json(
    {
      authenticated: true,
      account: {
        id: account.id,
        login: account.login,
        phone: account.phone,
      },
      workspace: {
        id: access.workspaceID,
      },
      project: {
        id: access.projectID,
      },
      directory: access.directory,
    },
    {
      headers: Workbench.accessHeaders(access),
    },
  )
}
