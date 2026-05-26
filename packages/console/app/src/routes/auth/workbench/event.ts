import { APIEvent } from "@solidjs/start"
import { Workbench } from "@opencode-ai/console-core/workbench.js"
import { useAuthSession } from "~/context/auth"

async function currentAccess(originalURI?: string) {
  const session = await useAuthSession()
  const current = session.data.current ? session.data.account?.[session.data.current] : undefined
  const fallback = Object.values(session.data.account ?? {})[0]
  const account = current ?? fallback
  if (!account) return
  const access = await Workbench.resolveAccess({ accountID: account.id, originalURI })
  if (!access) return
  await Workbench.ensureDirectory(access)
  return access
}

export async function GET(input: APIEvent) {
  const access = await currentAccess(input.request.headers.get("x-original-uri") ?? input.request.url)
  if (!access) return Response.json({ authenticated: false }, { status: 401 })

  const upstream = await fetch(Workbench.opencodeURL({ pathname: "/global/event", access }), {
    headers: Workbench.opencodeHeaders(),
  })
  if (!upstream.ok || !upstream.body) return Response.json({ authenticated: false }, { status: 502 })

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  return new Response(
    new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader()
        let buffer = ""

        while (true) {
          const next = await reader.read()
          if (next.done) break

          buffer += decoder.decode(next.value, { stream: true })
          const frames = buffer.split("\n\n")
          buffer = frames.pop() ?? ""

          for (const frame of frames) {
            const data = frame
              .split("\n")
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5).trimStart())
              .join("\n")
            const filtered = Workbench.filterGlobalEvent({ data, access })
            if (filtered) controller.enqueue(encoder.encode(`data: ${filtered}\n\n`))
          }
        }

        controller.close()
      },
      cancel() {
        upstream.body?.cancel()
      },
    }),
    {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "text/event-stream",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
      },
    },
  )
}
