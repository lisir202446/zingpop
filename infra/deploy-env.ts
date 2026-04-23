import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

const required = ["CLOUDFLARE_API_TOKEN", "PLANETSCALE_SERVICE_TOKEN_NAME", "PLANETSCALE_SERVICE_TOKEN", "STRIPE_SECRET_KEY"]

function parseValue(raw: string) {
  if (raw.length < 2) return raw
  const first = raw[0]
  if ((first === '"' || first === "'") && raw.endsWith(first)) return raw.slice(1, -1)
  return raw
}

function loadFile(file: string, inherited: Set<string>) {
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const body = trimmed.startsWith("export ") ? trimmed.slice(7) : trimmed
    const index = body.indexOf("=")
    if (index <= 0) continue
    const key = body.slice(0, index).trim()
    if (!key || inherited.has(key)) continue
    process.env[key] = parseValue(body.slice(index + 1).trim())
  }
}

function stageStripeKey(stage?: string) {
  if (stage === "dev") return "STRIPE_SECRET_KEY_DEV"
  if (stage === "production") return "STRIPE_SECRET_KEY_PROD"
  return `STRIPE_SECRET_KEY_${String(stage).toUpperCase().replaceAll(/[^A-Z0-9]+/g, "_")}`
}

export function envFiles(stage?: string) {
  return [".env.sst.local", stage ? `.env.sst.${stage}.local` : undefined].filter((item): item is string => Boolean(item))
}

export function loadDeployEnv(stage?: string) {
  const inherited = new Set(Object.keys(process.env).filter((key) => process.env[key] !== undefined))
  for (const file of envFiles(stage)) {
    const resolved = path.join(process.cwd(), file)
    if (!existsSync(resolved)) continue
    loadFile(resolved, inherited)
  }

  const stripe = process.env.STRIPE_SECRET_KEY ?? process.env[stageStripeKey(stage)]
  if (stripe) process.env.STRIPE_SECRET_KEY = stripe

  return {
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    PLANETSCALE_SERVICE_TOKEN_NAME: process.env.PLANETSCALE_SERVICE_TOKEN_NAME,
    PLANETSCALE_SERVICE_TOKEN: process.env.PLANETSCALE_SERVICE_TOKEN,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  }
}

export function missingDeployEnv(stage?: string) {
  const env = loadDeployEnv(stage)
  return required.filter((key) => !env[key as keyof typeof env])
}
