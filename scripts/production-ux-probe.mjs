#!/usr/bin/env bun

import { readdir } from "node:fs/promises"
import path from "node:path"

const args = parseArgs(Bun.argv.slice(2))
const dist = path.resolve(args.dist ?? "/opt/zingpop/app/dist")
const baseUrl = args.baseUrl ?? "https://app.zingpop.cn"
const expectedCommit = args.expectedCommit
const skipRemote = args.skipRemote === true
const results = []

function parseArgs(values) {
  return values.reduce((result, value, index) => {
    if (value === "--skip-remote") return { ...result, skipRemote: true }
    if (value === "--dist") return { ...result, dist: values[index + 1] }
    if (value === "--base-url") return { ...result, baseUrl: values[index + 1] }
    if (value === "--expected-commit") return { ...result, expectedCommit: values[index + 1] }
    if (value.startsWith("--dist=")) return { ...result, dist: value.slice("--dist=".length) }
    if (value.startsWith("--base-url=")) return { ...result, baseUrl: value.slice("--base-url=".length) }
    if (value.startsWith("--expected-commit=")) {
      return { ...result, expectedCommit: value.slice("--expected-commit=".length) }
    }
    return result
  }, {})
}

function record(status, name, detail) {
  results.push({ status, name, detail })
  console.log(`${status.toUpperCase()} ${name}${detail ? `: ${detail}` : ""}`)
}

async function readText(file) {
  const target = Bun.file(file)
  if (!(await target.exists())) return
  return target.text()
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) return listFiles(full)
        return [full]
      }),
    )
  ).flat()
}

function check(condition, name, detail) {
  record(condition ? "pass" : "fail", name, detail)
}

function checkBuildMarker(value, source) {
  if (!value) {
    check(false, `${source} build marker`, "missing zingpop-build.json")
    return
  }

  let json
  try {
    json = JSON.parse(value)
  } catch {
    check(false, `${source} build marker`, "invalid JSON")
    return
  }

  check(typeof json.commit === "string" && json.commit.length > 0, `${source} build marker commit`, json.commit)
  if (expectedCommit) check(json.commit === expectedCommit, `${source} expected commit`, json.commit)
}

console.log(`== production UX probe ==`)
console.log(`dist: ${dist}`)
if (!skipRemote) console.log(`base URL: ${baseUrl}`)
if (expectedCommit) console.log(`expected commit: ${expectedCommit}`)

checkBuildMarker(await readText(path.join(dist, "zingpop-build.json")), "local dist")

const jsFiles = (await listFiles(path.join(dist, "assets"))).filter((file) => file.endsWith(".js"))
check(jsFiles.length > 0, "compiled JS assets", `${jsFiles.length} file(s)`)

const bundled = (await Promise.all(jsFiles.map((file) => readText(file)))).filter((text) => text).join("\n")
const markers = [
  ["progress narrative component", "session-progress-narrative"],
  ["user-facing output gate", "userFacingAssistantOutput"],
  ["raw execution details toggle", "session-turn-raw-details-toggle"],
  ["html preview pending card", "正在准备 HTML 预览"],
  ["html preview ready card", "已生成 HTML 作品"],
]

for (const [name, marker] of markers) {
  check(bundled.includes(marker), name, marker)
}

if (!skipRemote) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/zingpop-build.json`, {
    headers: { "cache-control": "no-store" },
    signal: AbortSignal.timeout(10_000),
  }).catch((error) => error)

  if (response instanceof Error) {
    check(false, "remote build marker", response.message)
  } else {
    check(response.ok, "remote build marker HTTP", `${response.status}`)
    checkBuildMarker(await response.text(), "remote")
  }
}

const failures = results.filter((result) => result.status === "fail")
if (failures.length > 0) {
  console.error(`production UX probe failed: ${failures.length} issue(s)`)
  process.exit(1)
}

console.log("production UX probe completed")
