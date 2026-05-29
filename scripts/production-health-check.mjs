#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import tls from "node:tls"

const args = process.argv.slice(2)
const value = (name, fallback) => {
  const index = args.indexOf(name)
  if (index === -1) return fallback
  return args[index + 1] ?? fallback
}
const strict = args.includes("--strict")
const envFile = value("--env-file", "/etc/zingpop/zingpop.env")
const checks = []

function record(status, name, detail) {
  checks.push({ status, name, detail })
}

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=")
        if (index === -1) return [line, ""]
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")]
      }),
  )
}

const env = existsSync(envFile) ? parseEnv(readFileSync(envFile, "utf8")) : {}

function run(name, command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options })
  record(result.status === 0 ? "pass" : options.optional ? "warn" : "fail", name, (result.stdout || result.stderr || "").trim() || `exit ${result.status}`)
}

async function checkUrl(name, url, expected) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Number(env.ZINGPOP_HEALTH_TIMEOUT_MS ?? 10_000))
  return fetch(url, { redirect: "manual", signal: controller.signal })
    .then((response) => {
      clearTimeout(timer)
      record(expected.includes(response.status) ? "pass" : "fail", name, `${url} -> ${response.status}`)
    })
    .catch((error) => {
      clearTimeout(timer)
      record("fail", name, `${url} -> ${error instanceof Error ? error.message : String(error)}`)
    })
}

function certificateDays(hostname) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: hostname, port: 443, servername: hostname, timeout: 10_000 }, () => {
      const cert = socket.getPeerCertificate()
      socket.end()
      if (!cert.valid_to) return reject(new Error("no certificate expiry"))
      resolve(Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / 86_400_000))
    })
    socket.once("timeout", () => {
      socket.destroy()
      reject(new Error("TLS timeout"))
    })
    socket.once("error", reject)
  })
}

async function checkCertificate(hostname) {
  return certificateDays(hostname)
    .then((days) => {
      record(days >= Number(env.ZINGPOP_CERT_MIN_DAYS ?? 21) ? "pass" : "fail", `certificate ${hostname}`, `${days} day(s) remaining`)
    })
    .catch((error) => {
      record("fail", `certificate ${hostname}`, error instanceof Error ? error.message : String(error))
    })
}

function checkDisk(path) {
  if (!existsSync(path)) return record(strict ? "fail" : "warn", `disk ${path}`, "path does not exist")
  const result = spawnSync("df", ["-Pk", path], { encoding: "utf8" })
  if (result.status !== 0) return record("fail", `disk ${path}`, result.stderr.trim() || `exit ${result.status}`)
  const fields = result.stdout.trim().split(/\r?\n/).at(-1)?.split(/\s+/) ?? []
  const available = Number(fields[3] ?? 0)
  const total = Number(fields[1] ?? 0)
  const percent = total ? Math.floor((available / total) * 100) : 0
  record(percent >= Number(env.ZINGPOP_DISK_MIN_FREE_PERCENT ?? 15) ? "pass" : "fail", `disk ${path}`, `${percent}% free`)
}

function checkMysql() {
  if (!env.MYSQL_HOST || !env.MYSQL_USER || !env.MYSQL_PASSWORD) {
    return record(strict ? "fail" : "warn", "mysql ping", "MYSQL_HOST, MYSQL_USER, or MYSQL_PASSWORD missing")
  }
  run("mysql ping", "mysqladmin", ["ping", "-h", env.MYSQL_HOST, "-P", env.MYSQL_PORT ?? "3306", "-u", env.MYSQL_USER], {
    env: { ...process.env, MYSQL_PWD: env.MYSQL_PASSWORD },
  })
}

function checkSystemd() {
  if (process.platform === "win32") return record("warn", "systemd", "skipped on Windows")
  for (const service of ["nginx", "zingpop-console", "zingpop-opencode"]) {
    run(`systemd ${service}`, "systemctl", ["is-active", "--quiet", service])
  }
  for (const timer of ["zingpop-backup.timer", "zingpop-health-check.timer"]) {
    run(`systemd ${timer}`, "systemctl", ["is-enabled", "--quiet", timer], { optional: !strict })
  }
}

function checkBackups() {
  const backupRoot = env.ZINGPOP_BACKUP_ROOT ?? "/srv/zingpop/backups"
  if (!existsSync(backupRoot)) return record(strict ? "fail" : "warn", "backup root", `${backupRoot} does not exist`)
  run("latest backup", "bash", ["-lc", `find '${backupRoot.replaceAll("'", "'\\''")}' -mindepth 2 -maxdepth 2 -name SHA256SUMS -mtime -2 | head -n 1 | grep -q .`])
}

await Promise.all([
  checkUrl("www homepage", env.ZINGPOP_HEALTH_WWW_URL ?? "https://www.zingpop.cn/", [200]),
  checkUrl("app entry", env.ZINGPOP_HEALTH_APP_URL ?? "https://app.zingpop.cn/", [200, 302]),
  checkCertificate("www.zingpop.cn"),
  checkCertificate("app.zingpop.cn"),
])

checkSystemd()
checkDisk("/")
checkDisk("/srv/zingpop")
checkMysql()
checkBackups()

for (const check of checks) {
  console.log(`${check.status.toUpperCase()} ${check.name}: ${check.detail}`)
}

const failures = checks.filter((check) => check.status === "fail")

if (failures.length && env.ZINGPOP_ALERT_WEBHOOK_URL) {
  await fetch(env.ZINGPOP_ALERT_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      service: "zingpop",
      status: "failure",
      failures,
      time: new Date().toISOString(),
    }),
  }).catch((error) => console.error(`Failed to send alert webhook: ${error instanceof Error ? error.message : String(error)}`))
}

if (failures.length) {
  console.error(`production health check failed: ${failures.length} issue(s)`)
  process.exit(1)
}

console.log("production health check completed")
