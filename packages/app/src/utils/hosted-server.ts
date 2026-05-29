export function isHostedWorkbenchHost(hostname: string) {
  return hostname === "app.zingpop.cn"
}

export function defaultHostedServerUrl(input: {
  hostname: string
  origin: string
  stored: string | null
  dev: boolean
  devHost?: string
  devPort?: string
}) {
  if (isHostedWorkbenchHost(input.hostname)) return input.origin
  if (input.dev) return input.origin
  if (input.hostname.includes("opencode.ai")) return "http://localhost:4096"
  if (input.stored) return input.stored
  return input.origin
}
