#!/usr/bin/env bun
import { randomInt } from "node:crypto"
import { access } from "node:fs/promises"
import { SMS } from "../packages/console/core/src/sms"

const failures = []

function usage() {
  console.log(`Usage: bun scripts/production-auth-sms-probe.mjs [options]

Options:
  --env-file PATH          Production env file. Default: /etc/zingpop/zingpop.env
  --send-phone PHONE       Send one real SMS provider test message to this phone
  --send-code CODE         Verification code for --send-phone. Default: random 6 digits
  --help                   Print this help text

This probe validates production auth/SMS configuration. It sends a real SMS only
when --send-phone is provided. It does not create accounts or write login_code rows.
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

async function exists(file) {
  return access(file).then(
    () => true,
    () => false,
  )
}

async function loadEnv(file) {
  const text = await Bun.file(file).text()
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const value = match[2].trim()
    process.env[match[1]] =
      (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
        ? value.slice(1, -1)
        : value
  }
}

function check(ok, label, details = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${ok ? "" : ` :: ${details}`}`)
  if (!ok) failures.push(label)
}

function hasValue(name) {
  return Boolean(process.env[name]?.trim())
}

function notPlaceholder(name, forbidden) {
  const value = process.env[name]?.trim()
  return Boolean(value && !forbidden.includes(value))
}

function checkRequired(name) {
  check(hasValue(name), `${name} is configured`)
}

function randomCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0")
}

const args = parseArgs(process.argv.slice(2))
if (args.help) {
  usage()
  process.exit(0)
}

const config = {
  envFile: String(args["env-file"] ?? process.env.ZINGPOP_ENV_FILE ?? "/etc/zingpop/zingpop.env"),
  sendPhone: args["send-phone"] ? String(args["send-phone"]) : "",
  sendCode: args["send-code"] ? String(args["send-code"]) : randomCode(),
}

if (!(await exists(config.envFile))) {
  console.error(`Env file not found: ${config.envFile}`)
  process.exit(1)
}

await loadEnv(config.envFile)

console.log("== production auth env ==")
check(process.env.APP_STAGE === "production", "APP_STAGE is production", process.env.APP_STAGE ?? "missing")
check(process.env.AUTH_COOKIE_DOMAIN === ".zingpop.cn", "AUTH_COOKIE_DOMAIN covers www/app subdomains", process.env.AUTH_COOKIE_DOMAIN ?? "missing")
checkRequired("MYSQL_HOST")
checkRequired("MYSQL_PORT")
checkRequired("MYSQL_USER")
check(notPlaceholder("MYSQL_PASSWORD", ["replace-with-database-password", "password", "changeme"]), "MYSQL_PASSWORD is not a placeholder")
checkRequired("MYSQL_DATABASE")
check(notPlaceholder("ZEN_SESSION_SECRET", ["replace-with-a-long-random-secret", "changeme"]), "ZEN_SESSION_SECRET is not a placeholder")

console.log("== sms provider env ==")
check(SMS.isConfigured(), "SMS provider is configured")

if (process.env.SMS_PROVIDER === "huawei_apig" || process.env.HUAWEI_APIG_SMS_URL) {
  checkRequired("HUAWEI_APIG_SMS_URL")
  check(
    hasValue("HUAWEI_APIG_APPCODE") || (hasValue("HUAWEI_APIG_APP_KEY") && hasValue("HUAWEI_APIG_APP_SECRET")),
    "Huawei APIG authentication is configured",
  )
  checkRequired("HUAWEI_APIG_SMS_CONTENT_TEMPLATE")
  check(process.env.HUAWEI_APIG_SMS_CONTENT_TEMPLATE?.includes("{code}") === true, "Huawei APIG SMS template includes {code}")
}

if (process.env.HUAWEI_SMS_ENDPOINT) {
  checkRequired("HUAWEI_SMS_APP_KEY")
  checkRequired("HUAWEI_SMS_APP_SECRET")
  checkRequired("HUAWEI_SMS_SENDER")
  checkRequired("HUAWEI_SMS_TEMPLATE_ID")
}

if (config.sendPhone) {
  console.log("== real sms send probe ==")
  await SMS.sendLoginCode({
    phone: config.sendPhone,
    code: config.sendCode,
  })
  check(true, `real SMS provider accepted test message for ${config.sendPhone}`)
}

console.log("=== AUTH/SMS PROBE SUMMARY ===")
if (failures.length) {
  console.log(`FAILURES: ${failures.join(", ")}`)
  process.exit(1)
}

console.log("ALL PRODUCTION AUTH/SMS CONFIG PROBES PASSED")
