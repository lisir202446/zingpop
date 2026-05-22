#!/usr/bin/env bun
import { access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { randomUUID } from "node:crypto"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const failures = []
const created = []
const sessions = []

function usage() {
  console.log(`Usage: bun scripts/production-isolation-probe.mjs [options]

Options:
  --mode all|unauth|auth       Probe mode. Default: all
  --www-origin URL             Product/auth origin. Default: https://www.zingpop.cn
  --app-origin URL             Workbench origin. Default: https://app.zingpop.cn
  --env-file PATH              Production env file. Default: /etc/zingpop/zingpop.env
  --opencode-origin URL        Internal opencode origin. Default: env ZINGPOP_OPENCODE_ORIGIN or http://127.0.0.1:4096
  --help                       Print this help text
`)
}

function parseArgs(argv) {
  const result = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith("--")) continue
    const key = arg.slice(2)
    if (key === "help") {
      result.help = true
      continue
    }
    const next = argv[i + 1]
    if (!next || next.startsWith("--")) {
      result[key] = true
      continue
    }
    result[key] = next
    i++
  }
  return result
}

const args = parseArgs(process.argv.slice(2))
if (args.help) {
  usage()
  process.exit(0)
}

const config = {
  mode: String(args.mode ?? process.env.ZINGPOP_PROBE_MODE ?? "all"),
  wwwOrigin: String(args["www-origin"] ?? process.env.ZINGPOP_PROBE_WWW_ORIGIN ?? "https://www.zingpop.cn"),
  appOrigin: String(args["app-origin"] ?? process.env.ZINGPOP_PROBE_APP_ORIGIN ?? "https://app.zingpop.cn"),
  envFile: String(args["env-file"] ?? process.env.ZINGPOP_ENV_FILE ?? "/etc/zingpop/zingpop.env"),
  opencodeOrigin: args["opencode-origin"] ? String(args["opencode-origin"]) : undefined,
}

if (!["all", "unauth", "auth"].includes(config.mode)) {
  console.error(`Invalid --mode: ${config.mode}`)
  usage()
  process.exit(1)
}

function check(ok, label, details = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${ok ? "" : ` :: ${String(details).slice(0, 300)}`}`)
  if (!ok) failures.push(label)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function exists(file) {
  return access(file).then(() => true, () => false)
}

async function loadEnv(file) {
  const text = await Bun.file(file).text().catch(() => "")
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[match[1]] === undefined) process.env[match[1]] = value
  }
}

function appURL(pathname, params = {}) {
  const url = new URL(pathname, config.appOrigin)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url
}

function wwwURL(pathname, params = {}) {
  const url = new URL(pathname, config.wwwOrigin)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url
}

async function fetchText(label, url, options = {}) {
  const response = await fetch(url, { redirect: "manual", ...options })
  const text = await response.text()
  const location = response.headers.get("location")
  console.log(`${label}: HTTP ${response.status}${location ? ` -> ${location}` : ""}`)
  if (response.status >= 400 && text) console.log(text.slice(0, 300))
  return { response, text, location }
}

async function fetchJSON(label, url, options = {}) {
  const result = await fetchText(label, url, options)
  let json
  try {
    json = JSON.parse(result.text)
  } catch {}
  return { ...result, json }
}

async function runUnauthenticatedProbes() {
  console.log("== unauthenticated public probes ==")
  const home = await fetchText("www /", wwwURL("/"))
  check(home.response.status === 200, "www home returns 200", `HTTP ${home.response.status}`)

  const app = await fetchText("app /", appURL("/"))
  check(app.response.status === 302, "app root redirects to login", `HTTP ${app.response.status}`)
  check(app.location?.includes("/auth/phone"), "app root login redirect points to phone auth", app.location ?? "")

  const rootOverride = await fetchText("app /?directory=/root", appURL("/", { directory: "/root" }))
  check(rootOverride.response.status === 302, "unauth directory override redirects to login", `HTTP ${rootOverride.response.status}`)

  const workspaceOverride = await fetchText("app /?workspace=wrk_fake", appURL("/", { workspace: "wrk_fake" }))
  check(workspaceOverride.response.status === 403, "unauth workspace query injection is blocked", `HTTP ${workspaceOverride.response.status}`)

  for (const target of ["/sync/history", "/tui/select-session", "/global/dispose", "/instance/dispose"]) {
    const result = await fetchText(`app ${target}`, appURL(target))
    check(result.response.status === 403, `${target} is blocked without auth`, `HTTP ${result.response.status}`)
  }

  const event = await fetchText("app /global/event", appURL("/global/event"))
  check(event.response.status === 302, "unauth global event redirects to login", `HTTP ${event.response.status}`)
  check(event.location?.includes("/auth/phone"), "global event login redirect points to phone auth", event.location ?? "")
}

async function importLocal(file) {
  return import(pathToFileURL(path.join(repoRoot, file)).href)
}

async function findH3() {
  const candidates = []
  for (const store of [
    path.join(repoRoot, "node_modules", ".bun"),
    path.join(repoRoot, "packages", "console", "app", "node_modules", ".bun"),
    path.join(repoRoot, "packages", "opencode", "node_modules", ".bun"),
  ]) {
    if (!(await exists(store))) continue
    for (const entry of await Array.fromAsync(new Bun.Glob("h3@*/node_modules/h3/dist/h3.mjs").scan({ cwd: store }))) {
      candidates.push(path.join(store, entry))
    }
  }

  for (const candidate of [
    ...candidates,
    path.join(repoRoot, "node_modules", "h3", "dist", "h3.mjs"),
    path.join(repoRoot, "packages", "console", "app", "node_modules", "h3", "dist", "h3.mjs"),
  ]) {
    if (!(await exists(candidate))) continue
    try {
      const mod = await import(pathToFileURL(candidate).href)
      if (typeof mod.mockEvent === "function" && typeof mod.sealSession === "function") return mod
    } catch {}
  }

  throw new Error("Cannot find an importable h3 module with mockEvent and sealSession")
}

async function createProbeAccount(input) {
  const accountID = input.Identifier.create("account")
  const workspaceID = input.Identifier.create("workspace")
  const userID = input.Identifier.create("user")
  const billingID = input.Identifier.create("billing")
  const authID = input.Identifier.create("auth")
  const subject = `+199${Date.now()}${input.label}${Math.floor(Math.random() * 100000)}`
  const slug = `probe-${Date.now()}-${input.label.toLowerCase()}-${Math.floor(Math.random() * 100000)}`

  await input.Database.transaction(async (tx) => {
    await tx.insert(input.AccountTable).values({ id: accountID })
    await tx.insert(input.WorkspaceTable).values({ id: workspaceID, slug, name: `Probe ${input.label}` })
    await tx.insert(input.UserTable).values({ id: userID, workspaceID, accountID, name: `Probe ${input.label}`, role: "admin" })
    await tx.insert(input.BillingTable).values({ id: billingID, workspaceID, balance: 0 })
    await tx.insert(input.AuthTable).values({ id: authID, provider: "phone", subject, accountID })
  })

  const access = await input.Workbench.resolveAccess({ accountID })
  if (!access) throw new Error(`No workbench access resolved for ${input.label}`)
  await input.Workbench.ensureDirectory(access)

  const event = input.h3.mockEvent(new Request(config.wwwOrigin))
  event.context.sessions = {
    auth: {
      id: randomUUID(),
      createdAt: Date.now(),
      data: {
        current: accountID,
        account: {
          [accountID]: {
            id: accountID,
            login: subject,
            phone: subject,
          },
        },
      },
    },
  }

  const sealed = await input.h3.sealSession(event, {
    name: "auth",
    password: process.env.ZEN_SESSION_SECRET || process.env.SESSION_SECRET || "local-dev-session-secret-0123456789",
    maxAge: 60 * 60 * 24 * 365,
    cookie: {
      secure: true,
      httpOnly: true,
      domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
      sameSite: "lax",
    },
  })

  const account = { label: input.label, accountID, workspaceID, access, cookie: `auth=${encodeURIComponent(sealed)}` }
  created.push(account)
  console.log(`${input.label}: account=${accountID} workspace=${workspaceID} directory=${access.directory}`)
  return account
}

function opencodeOrigin() {
  return config.opencodeOrigin ?? process.env.ZINGPOP_OPENCODE_ORIGIN ?? `http://127.0.0.1:${process.env.ZINGPOP_PORT ?? "4096"}`
}

function opencodeAuthHeaders() {
  if (!process.env.OPENCODE_SERVER_PASSWORD) return {}
  return {
    Authorization: `Basic ${Buffer.from(`${process.env.OPENCODE_SERVER_USERNAME || "opencode"}:${process.env.OPENCODE_SERVER_PASSWORD}`).toString("base64")}`,
  }
}

async function createSession(owner, label, directory) {
  const result = await fetchJSON(label, appURL("/session", directory ? { directory } : {}), {
    method: "POST",
    headers: {
      Cookie: owner.cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: label }),
  })

  check(result.response.status === 200, `${label} returns 200`, result.text)
  check(result.json?.directory === owner.access.directory, `${label} forced to own directory`, result.json?.directory)
  if (result.json?.id) sessions.push({ id: result.json.id, owner })
  return result.json
}

async function triggerToast(owner, marker) {
  const url = new URL("/tui/show-toast", opencodeOrigin())
  url.searchParams.set("directory", owner.access.directory)
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...opencodeAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "isolation-probe",
      message: marker,
      variant: "info",
      duration: 1000,
    }),
  })
  const text = await response.text()
  check(response.status === 200, `internal toast ${marker}`, text)
}

async function eventProbe(a, b) {
  const markerA = `ZINGPOP_ISOLATION_EVENT_A_${Date.now()}`
  const markerB = `ZINGPOP_ISOLATION_EVENT_B_${Date.now()}`
  const controller = new AbortController()
  const events = []
  let streamStatus = 0

  const streamTask = (async () => {
    const response = await fetch(appURL("/global/event"), {
      headers: { Cookie: a.cookie },
      signal: controller.signal,
    })
    streamStatus = response.status
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (reader) {
      const chunk = await reader.read()
      if (chunk.done) break
      buffer += decoder.decode(chunk.value, { stream: true })
      const frames = buffer.split(/\n\n/)
      buffer = frames.pop() ?? ""
      for (const frame of frames) {
        const data = frame
          .split(/\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n")
        if (!data) continue
        try {
          events.push(JSON.parse(data))
        } catch {}
      }
    }
  })().catch((error) => {
    if (error.name !== "AbortError") throw error
  })

  await sleep(1200)
  await triggerToast(b, markerB)
  await sleep(300)
  await triggerToast(a, markerA)
  await sleep(3500)
  controller.abort()
  await streamTask

  const dump = events.map((event) => JSON.stringify(event)).join("\n")
  console.log(`event stream frames: ${events.length}`)
  check(streamStatus === 200, "A /global/event stream opens", `HTTP ${streamStatus}`)
  check(dump.includes(markerA), "event stream includes own workspace event", dump)
  check(!dump.includes(markerB), "event stream excludes other workspace event", dump)
  check(
    !events.some((event) => event.directory === b.access.directory || event.workspace === b.access.workspaceID),
    "event stream has no other account directory/workspace metadata",
  )
}

async function cleanup(input) {
  for (const session of sessions) {
    await fetch(appURL(`/session/${encodeURIComponent(session.id)}`), {
      method: "DELETE",
      headers: { Cookie: session.owner.cookie },
    }).catch(() => undefined)
  }

  if (!created.length) return
  await input.Database.transaction(async (tx) => {
    await tx.update(input.AuthTable).set({ timeDeleted: input.sql`now(3)` }).where(input.inArray(input.AuthTable.accountID, created.map((item) => item.accountID)))
    await tx.update(input.UserTable).set({ timeDeleted: input.sql`now(3)` }).where(input.inArray(input.UserTable.workspaceID, created.map((item) => item.workspaceID)))
    await tx.update(input.BillingTable).set({ timeDeleted: input.sql`now(3)` }).where(input.inArray(input.BillingTable.workspaceID, created.map((item) => item.workspaceID)))
    await tx.update(input.WorkspaceTable).set({ timeDeleted: input.sql`now(3)` }).where(input.inArray(input.WorkspaceTable.id, created.map((item) => item.workspaceID)))
    await tx.update(input.AccountTable).set({ timeDeleted: input.sql`now(3)` }).where(input.inArray(input.AccountTable.id, created.map((item) => item.accountID)))
  })
}

async function runAuthenticatedProbes() {
  console.log("== authenticated isolation probes ==")
  await loadEnv(config.envFile)
  process.env.NODE_ENV ||= "production"
  process.chdir(repoRoot)

  const drizzle = await importLocal("packages/console/core/src/drizzle/index.ts")
  const modules = {
    Database: drizzle.Database,
    inArray: drizzle.inArray,
    sql: drizzle.sql,
    ...(await importLocal("packages/console/core/src/identifier.ts")),
    ...(await importLocal("packages/console/core/src/workbench.ts")),
    ...(await importLocal("packages/console/core/src/schema/account.sql.ts")),
    ...(await importLocal("packages/console/core/src/schema/auth.sql.ts")),
    ...(await importLocal("packages/console/core/src/schema/workspace.sql.ts")),
    ...(await importLocal("packages/console/core/src/schema/user.sql.ts")),
    ...(await importLocal("packages/console/core/src/schema/billing.sql.ts")),
    h3: await findH3(),
  }

  try {
    const a = await createProbeAccount({ ...modules, label: "A" })
    const b = await createProbeAccount({ ...modules, label: "B" })

    const authA = await fetchJSON("A auth/status", wwwURL("/auth/status"), {
      headers: { Cookie: a.cookie },
    })
    check(authA.response.status === 200, "A auth/status is logged in", authA.text)
    check(authA.json?.directory === a.access.directory, "A auth/status returns own directory", authA.json?.directory)
    check(authA.json?.workspace?.id === a.access.workspaceID, "A auth/status returns own workspace", authA.json?.workspace?.id)

    const rootSession = await createSession(a, "A create with directory=/root", "/root")
    await createSession(a, "A create with shared default directory override", `${modules.Workbench.root().replace(/\/+$/, "")}/default`)
    await createSession(a, "A create with B directory override", b.access.directory)
    const bSession = await createSession(b, "B create own session")

    const listRoot = await fetchJSON("A list with directory=/root override", appURL("/session", { directory: "/root" }), {
      headers: { Cookie: a.cookie },
    })
    check(Array.isArray(listRoot.json), "A list override returns an array", listRoot.text)
    check(listRoot.json?.some?.((item) => item.id === rootSession?.id), "A list override still sees own created session")
    check(listRoot.json?.every?.((item) => item.directory === a.access.directory), "A list override only returns own directory")

    const clientWorkspace = await fetchText("A client workspace query attack", appURL("/", { workspace: "wrk_fake" }), {
      headers: { Cookie: a.cookie },
    })
    check(clientWorkspace.response.status === 403, "client supplied workspace query is blocked", `HTTP ${clientWorkspace.response.status}`)

    const own = await fetchJSON("A read own session", appURL(`/session/${encodeURIComponent(rootSession.id)}`), {
      headers: { Cookie: a.cookie },
    })
    check(own.response.status === 200, "A can read own session", own.text)

    const crossAB = await fetchText("A read B session", appURL(`/session/${encodeURIComponent(bSession.id)}`), {
      headers: { Cookie: a.cookie },
    })
    check(crossAB.response.status === 403, "A cannot read B session", `HTTP ${crossAB.response.status}`)

    const crossBA = await fetchText("B read A session", appURL(`/session/${encodeURIComponent(rootSession.id)}`), {
      headers: { Cookie: b.cookie },
    })
    check(crossBA.response.status === 403, "B cannot read A session", `HTTP ${crossBA.response.status}`)

    await eventProbe(a, b)
  } finally {
    await cleanup(modules).catch((error) => {
      console.error("cleanup failed", error)
      failures.push("cleanup")
    })
  }
}

let exitCode = 0
try {
  if (config.mode === "all" || config.mode === "unauth") await runUnauthenticatedProbes()
  if (config.mode === "all" || config.mode === "auth") await runAuthenticatedProbes()

  console.log("=== PROBE SUMMARY ===")
  if (failures.length) {
    console.log(`FAILURES: ${failures.join(", ")}`)
    exitCode = 1
  } else {
    console.log("ALL PRODUCTION ISOLATION PROBES PASSED")
  }
} catch (error) {
  console.error(error)
  exitCode = 1
}

process.exit(exitCode)
