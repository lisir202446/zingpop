import { localeFromRequest, route } from "./language"

function base64Encode(value: string) {
  const bytes = new TextEncoder().encode(value)
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("")
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function host(value: string | undefined) {
  const next = value?.trim().replace(/\/+$/, "")
  if (!next) return
  if (URL.canParse(next)) return new URL(next).host
  if (URL.canParse(`https://${next}`)) return new URL(`https://${next}`).host
}

function appOrigin() {
  const domain = process.env.ZINGPOP_APP_DOMAIN?.trim().replace(/\/+$/, "")
  if (!domain) return
  if (URL.canParse(domain)) return domain
  if (URL.canParse(`https://${domain}`)) return `https://${domain}`
}

function defaultWorkspaceDirectory() {
  if (process.env.ZINGPOP_DEFAULT_WORKSPACE_DIR) return process.env.ZINGPOP_DEFAULT_WORKSPACE_DIR
  return `${(process.env.ZINGPOP_WORKSPACE_ROOT ?? "/srv/zingpop/workspaces").replace(/\/+$/, "")}/default`
}

const safeSegment = /^[A-Za-z0-9_-]+$/

function defaultProjectID() {
  return process.env.ZINGPOP_DEFAULT_PROJECT_ID?.trim() || "default"
}

function workspaceDirectory(workspaceID: string | undefined) {
  if (!workspaceID || !safeSegment.test(workspaceID)) return defaultWorkspaceDirectory()
  return `${(process.env.ZINGPOP_WORKSPACE_ROOT ?? "/srv/zingpop/workspaces").replace(/\/+$/, "")}/${workspaceID}/projects/${defaultProjectID()}`
}

function defaultWorkbenchLocation(workspaceID?: string) {
  const origin = appOrigin()
  if (!origin) return
  return `${origin}/${base64Encode(workspaceDirectory(workspaceID))}/session`
}

function isLocalHttp(url: URL) {
  return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")
}

function appWorkbenchLocation(url: URL, workspaceID?: string) {
  if (host(process.env.ZINGPOP_APP_DOMAIN) !== url.host) return
  if (url.pathname === "/" && !url.search && !url.hash) return defaultWorkbenchLocation(workspaceID)
  const prompts = url.pathname.match(/^\/([A-Za-z0-9_-]+)\/prompts\/?$/)
  if (!prompts) return
  return `${url.origin}/${prompts[1]}/session`
}

function safeRedirectLocation(request: Request, target: string, workspaceID?: string) {
  const value = target.trim()
  if (!value) return
  if (value.startsWith("/") && !value.startsWith("//")) return route(localeFromRequest(request), value)
  if (!URL.canParse(value)) return

  const url = new URL(value)
  if (url.protocol !== "https:" && !isLocalHttp(url)) return

  const allowed = new Set(
    [new URL(request.url).host, host(process.env.ZINGPOP_DOMAIN), host(process.env.ZINGPOP_APP_DOMAIN)].filter(
      (item): item is string => !!item,
    ),
  )
  if (!allowed.has(url.host)) return
  const workbench = appWorkbenchLocation(url, workspaceID)
  if (workbench) return workbench
  return url.toString()
}

export function authSuccessRedirectLocation(request: Request, next: string, fallback: string, workspaceID?: string) {
  return safeRedirectLocation(request, next, workspaceID) ?? defaultWorkbenchLocation(workspaceID) ?? route(localeFromRequest(request), fallback)
}
