import { describe, expect, test } from "bun:test"
import { proxiedDevFetch, proxiedDevFetchInput, proxiedDevServerUrl } from "./server"

describe("proxiedDevServerUrl", () => {
  test("routes the local opencode server through the vite origin in dev", () => {
    expect(proxiedDevServerUrl("http://127.0.0.1:4096", "http://localhost:3000", true)).toBe("http://localhost:3000")
    expect(proxiedDevServerUrl("http://localhost:4096", "http://localhost:3000", true)).toBe("http://localhost:3000")
  })

  test("keeps non-opencode and remote URLs unchanged", () => {
    expect(proxiedDevServerUrl("http://localhost:3000", "http://localhost:3000", true)).toBe("http://localhost:3000")
    expect(proxiedDevServerUrl("https://app.zingpop.cn", "http://localhost:3000", true)).toBe("https://app.zingpop.cn")
  })

  test("keeps the configured URL outside dev", () => {
    expect(proxiedDevServerUrl("http://127.0.0.1:4096", "https://app.zingpop.cn", false)).toBe(
      "http://127.0.0.1:4096",
    )
  })
})

describe("proxiedDevFetchInput", () => {
  test("routes string and URL requests through the vite origin in dev", () => {
    expect(
      proxiedDevFetchInput("http://127.0.0.1:4096/session/ses_test/prompt_async?stream=1", "http://localhost:3000", true),
    ).toBe("http://localhost:3000/session/ses_test/prompt_async?stream=1")

    expect(
      proxiedDevFetchInput(new URL("http://localhost:4096/global/health"), "http://localhost:3000", true).toString(),
    ).toBe("http://localhost:3000/global/health")
  })

  test("routes request objects through the vite origin in dev", async () => {
    const input = new Request("http://127.0.0.1:4096/session", {
      method: "POST",
      body: "hello",
    })
    const result = proxiedDevFetchInput(input, "http://localhost:3000", true)

    expect(result).toBeInstanceOf(Request)
    expect((result as Request).url).toBe("http://localhost:3000/session")
    expect((result as Request).method).toBe("POST")
    expect(await (result as Request).text()).toBe("hello")
  })

  test("keeps request objects outside dev", () => {
    const input = new Request("http://127.0.0.1:4096/session")

    expect(proxiedDevFetchInput(input, "http://localhost:3000", false)).toBe(input)
  })
})

describe("proxiedDevFetch", () => {
  test("normalizes dev request objects to fetch url and init", async () => {
    await proxiedDevFetch(
      Object.assign(async (request: RequestInfo | URL, init?: RequestInit) => {
        expect(request).toBe("http://localhost:3000/session")
        expect(init?.method).toBe("POST")
        expect(init?.headers).toBeInstanceOf(Headers)
        expect(await new Response(init?.body).text()).toBe("hello")
        return new Response(null, { status: 204 })
      }, { preconnect: () => {} }),
      "http://localhost:3000",
      true,
    )(
      new Request("http://127.0.0.1:4096/session", {
        body: "hello",
        headers: { "content-type": "text/plain" },
        method: "POST",
      }),
    )
  })

  test("keeps the SDK browser fetch timeout override outside dev", async () => {
    await proxiedDevFetch(
      Object.assign(async (request: RequestInfo | URL) => {
        expect(request).toBeInstanceOf(Request)
        expect((request as Request).url).toBe("http://127.0.0.1:4096/session")
        expect((request as Request & { timeout?: boolean }).timeout).toBe(false)
        return new Response(null, { status: 204 })
      }, { preconnect: () => {} }),
      "http://localhost:3000",
      false,
    )(new Request("http://127.0.0.1:4096/session"))
  })
})
