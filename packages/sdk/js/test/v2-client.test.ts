import { describe, expect, test } from "bun:test"
import { createOpencodeClient } from "../src/v2/client"

describe("createOpencodeClient", () => {
  test("adds directory query params to POST requests", async () => {
    const requests: Request[] = []
    const client = createOpencodeClient({
      baseUrl: "https://app.zingpop.cn",
      directory: "/srv/zingpop/workspaces/wrk/projects/prj",
      fetch: async (request: Request) => {
        requests.push(request)
        return Response.json({})
      },
    })

    await client.session.create({ title: "hello" })

    expect(requests).toHaveLength(1)
    expect(requests[0]?.method).toBe("POST")
    expect(new URL(requests[0]!.url).searchParams.get("directory")).toBe(
      "/srv/zingpop/workspaces/wrk/projects/prj",
    )
    expect(requests[0]?.headers.has("x-opencode-directory")).toBe(false)
  })

  test("adds directory query params to global event streams", async () => {
    const requests: Request[] = []
    const client = createOpencodeClient({
      baseUrl: "https://app.zingpop.cn",
      directory: "/srv/zingpop/workspaces/wrk/projects/prj",
      fetch: async (request: Request) => {
        requests.push(request)
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('data: {"type":"server.connected","properties":{}}\n\n'))
              controller.close()
            },
          }),
          {
            headers: {
              "Content-Type": "text/event-stream",
            },
          },
        )
      },
    })

    const events = await client.global.event()
    await events.stream.next()

    expect(requests).toHaveLength(1)
    expect(requests[0]?.method).toBe("GET")
    expect(new URL(requests[0]!.url).searchParams.get("directory")).toBe(
      "/srv/zingpop/workspaces/wrk/projects/prj",
    )
    expect(requests[0]?.headers.has("x-opencode-directory")).toBe(false)
  })
})
