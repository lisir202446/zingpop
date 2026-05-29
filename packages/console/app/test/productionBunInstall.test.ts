import { describe, expect, test } from "bun:test"

const repo = new URL("../../../../", import.meta.url)

describe("production bun install", () => {
  test("production build uses the reliable installer", async () => {
    const build = await Bun.file(new URL("scripts/production-build.sh", repo)).text()

    expect(build).toContain("scripts/production-bun-install.sh")
  })

  test("skip install mode skips opencode build-time package installs", async () => {
    const build = await Bun.file(new URL("scripts/production-build.sh", repo)).text()

    expect(build).toContain("OPENCODE_BUILD_ARGS=(--single)")
    expect(build).toContain('OPENCODE_BUILD_ARGS+=(--skip-install)')
    expect(build).toContain('bun run --cwd packages/opencode build "${OPENCODE_BUILD_ARGS[@]}"')
  })

  test("installer avoids stale cache tarballs and verifies critical packages", async () => {
    const install = await Bun.file(new URL("scripts/production-bun-install.sh", repo)).text()

    expect(install).toContain("--frozen-lockfile")
    expect(install).toContain("--force")
    expect(install).toContain("--registry")
    expect(install).toContain("--cache-dir")
    expect(install).toContain("--network-concurrency")
    expect(install).toContain("--backend=copyfile")
    expect(install).toContain("@opentui/solid/preload")
    expect(install).toContain("tailwindcss/theme.css")
    expect(install).toContain("@tsconfig/node22/tsconfig.json")
    expect(install).toContain("katex/dist/katex.min.css")
  })
})
