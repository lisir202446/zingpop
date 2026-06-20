import path from "node:path"

const version = Bun.argv[2]?.trim()

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error("Usage: bun scripts/set-version.ts <semver>, for example 1.14.20 or 1.14.20-beta.1")
}

const package_file = Bun.file(path.join(import.meta.dir, "..", "package.json"))
const package_json = await package_file.json()

await Bun.write(
  package_file,
  JSON.stringify(
    {
      ...package_json,
      version,
    },
    null,
    2,
  ) + "\n",
)

console.log(`Zingpop desktop version set to ${version}`)
