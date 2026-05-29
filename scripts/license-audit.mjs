#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

const args = process.argv.slice(2)
const value = (name, fallback) => {
  const index = args.indexOf(name)
  if (index === -1) return fallback
  return args[index + 1] ?? fallback
}
const repo = resolve(value("--repo", process.cwd()))
const includeDev = args.includes("--include-dev")
const disallowed = /\b(AGPL|GPL|SSPL)\b|BUSL|Commons Clause|PolyForm|proprietary|UNLICENSED/i
const review = /\bLGPL\b|Elastic License|Server Side Public License/i
const reviewedLicenseOverrides = new Map([
  ["@openauthjs/openauth", "MIT (reviewed upstream repository license; installed package metadata omits license)"],
  ["@solidjs/start", "MIT (reviewed npm package metadata; installed prerelease metadata can omit license)"],
])

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"))
}

function packageJsonFiles() {
  return [
    "package.json",
    ...["packages", "packages/console"].flatMap((base) => {
      const dir = join(repo, base)
      if (!existsSync(dir)) return []
      return readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(base, entry.name, "package.json"))
        .filter((path) => existsSync(join(repo, path)))
    }),
    "packages/sdk/js/package.json",
  ].filter((path, index, all) => existsSync(join(repo, path)) && all.indexOf(path) === index)
}

function directDependencies() {
  return [...new Set(
    packageJsonFiles().flatMap((path) => {
      const json = readJson(join(repo, path))
      return [
        ...Object.keys(json.dependencies ?? {}),
        ...(includeDev ? Object.keys(json.devDependencies ?? {}) : []),
      ].filter((name) => !name.startsWith("@opencode-ai/"))
    }),
  )].sort()
}

function candidatePackageJsons(name) {
  return packageJsonFiles()
    .map((path) => dirname(join(repo, path)))
    .flatMap((dir) => [join(dir, "node_modules", name, "package.json"), join(repo, "node_modules", name, "package.json")])
}

function resolvePackage(name) {
  const found = candidatePackageJsons(name).find((path) => existsSync(path))
  if (!found) return
  return {
    name,
    path: found,
    json: readJson(found),
  }
}

const results = directDependencies().map((name) => resolvePackage(name) ?? { name, missing: true })
const missing = results.filter((item) => item.missing).map((item) => item.name)
const present = results.filter((item) => !item.missing)
const licenseOf = (item) => item.json.license ?? reviewedLicenseOverrides.get(item.name)
const unreviewedMissingLicense = present.filter((item) => !item.json.license && !reviewedLicenseOverrides.has(item.name))
const risky = present.filter((item) => disallowed.test(String(licenseOf(item) ?? "")))
const needsReview = present.filter((item) => review.test(String(licenseOf(item) ?? "")))

for (const item of present) {
  console.log(`${item.name}: ${licenseOf(item) ?? "NO LICENSE"} (${item.path.replace(repo, ".")})`)
}

if (missing.length) {
  console.warn(`WARN missing package metadata: ${missing.join(", ")}`)
}

if (needsReview.length) {
  console.warn(`WARN manual review required: ${needsReview.map((item) => `${item.name}=${licenseOf(item)}`).join(", ")}`)
}

if (unreviewedMissingLicense.length) {
  console.error(`FAIL unreviewed missing license metadata: ${unreviewedMissingLicense.map((item) => item.name).join(", ")}`)
  process.exit(1)
}

if (risky.length) {
  console.error(`FAIL disallowed license found: ${risky.map((item) => `${item.name}=${licenseOf(item)}`).join(", ")}`)
  process.exit(1)
}

console.log(`license audit completed: ${present.length} package(s), ${missing.length} missing metadata warning(s), ${needsReview.length} manual review warning(s)`)
