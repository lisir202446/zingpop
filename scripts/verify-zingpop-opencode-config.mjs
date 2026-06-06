#!/usr/bin/env bun
import { readFile } from "node:fs/promises"

const configUrl = new URL("../deploy/opencode/opencode.json", import.meta.url)
const raw = await readFile(configUrl, "utf8")
const config = JSON.parse(raw)
const errors = []

const assertEqual = (label, actual, expected) => {
  if (JSON.stringify(actual) === JSON.stringify(expected)) return
  errors.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

assertEqual("enabled_providers", config.enabled_providers, ["zai-glm"])
assertEqual("model", config.model, "zai-glm/glm-5-turbo")
assertEqual("small_model", config.small_model, "zai-glm/glm-5-turbo")
assertEqual("agent.build.model", config.agent?.build?.model, "zai-glm/glm-5-turbo")
assertEqual("provider keys", Object.keys(config.provider ?? {}), ["zai-glm"])
assertEqual("zai-glm model keys", Object.keys(config.provider?.["zai-glm"]?.models ?? {}), ["glm-5-turbo"])

for (const marker of ["MyTokenLand", "mytokenland", "Qwen", "qwen", "openrouter", "deepseek"]) {
  if (!raw.includes(marker)) continue
  errors.push(`forbidden marker present: ${marker}`)
}

if (errors.length > 0) {
  console.error("Zingpop opencode config verification failed:")
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log("Zingpop opencode config verified: zai-glm/glm-5-turbo only")
