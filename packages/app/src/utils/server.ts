import { createOpencodeClient } from "@opencode-ai/sdk/v2/client"
import type { ServerConnection } from "@/context/server"

function isLocalOpencodeServer(url: URL) {
  return url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname) && url.port === "4096"
}

export function proxiedDevServerUrl(input: string, origin = globalThis.location?.origin, dev = import.meta.env.DEV) {
  if (!dev || !origin) return input

  const url = new URL(input)
  if (!isLocalOpencodeServer(url)) return input
  return origin
}

export function proxiedDevRequestUrl(input: string, origin = globalThis.location?.origin, dev = import.meta.env.DEV) {
  if (!dev || !origin) return input

  const url = new URL(input)
  if (!isLocalOpencodeServer(url)) return input
  return `${origin}${url.pathname}${url.search}${url.hash}`
}

export function proxiedDevFetchInput(
  input: RequestInfo | URL,
  origin = globalThis.location?.origin,
  dev = import.meta.env.DEV,
): RequestInfo | URL {
  if (typeof input === "string") return proxiedDevRequestUrl(input, origin, dev)
  if (input instanceof URL) return new URL(proxiedDevRequestUrl(input.toString(), origin, dev))
  if (input instanceof Request) {
    const url = proxiedDevRequestUrl(input.url, origin, dev)
    if (url === input.url) return input
    return new Request(url, input)
  }
  return input
}

async function devRequestInit(request: Request): Promise<RequestInit> {
  return {
    body:
      request.method === "GET" || request.method === "HEAD" ? undefined : await request.clone().arrayBuffer(),
    cache: request.cache,
    credentials: request.credentials,
    headers: request.headers,
    integrity: request.integrity,
    keepalive: request.keepalive,
    method: request.method,
    mode: request.mode,
    redirect: request.redirect,
    referrerPolicy: request.referrerPolicy,
    signal: request.signal,
  }
}

export function proxiedDevFetch(fetch = globalThis.fetch, origin = globalThis.location?.origin, dev = import.meta.env.DEV) {
  const fetcher = fetch === globalThis.fetch ? globalThis.fetch.bind(globalThis) : fetch
  return Object.assign(async (input: RequestInfo | URL, init?: RequestInit) => {
    const next = proxiedDevFetchInput(input, origin, dev)
    if (next instanceof Request && !dev) {
      ;(next as Request & { timeout?: boolean }).timeout = false
    }
    if (dev && next instanceof Request) return fetcher(next.url, await devRequestInit(next))
    return fetcher(next, init)
  }, {
    preconnect: typeof fetch.preconnect === "function" ? fetch.preconnect.bind(fetch) : () => {},
  })
}

export function createSdkForServer({
  server,
  ...config
}: Omit<NonNullable<Parameters<typeof createOpencodeClient>[0]>, "baseUrl"> & {
  server: ServerConnection.HttpBase
}) {
  const fetch = config.fetch ? proxiedDevFetch(config.fetch) : undefined
  const baseUrl = proxiedDevServerUrl(server.url)
  const auth = (() => {
    if (!server.password) return
    return {
      Authorization: `Basic ${btoa(`${server.username ?? "opencode"}:${server.password}`)}`,
    }
  })()

  return createOpencodeClient({
    ...config,
    headers: {
      ...(config.headers instanceof Headers ? Object.fromEntries(config.headers.entries()) : config.headers),
      ...auth,
    },
    baseUrl,
    fetch: fetch ?? proxiedDevFetch(),
  })
}
