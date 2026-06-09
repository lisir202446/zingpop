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

  test("production workbench build forces the Zingpop hosted project flow", async () => {
    const build = await Bun.file(new URL("scripts/production-build.sh", repo)).text()

    expect(build).toContain("export VITE_ZINGPOP_HOSTED_WORKBENCH=1")
  })

  test("production workbench build writes a public commit marker", async () => {
    const build = await Bun.file(new URL("scripts/production-build.sh", repo)).text()

    expect(build).toContain("BUILD_COMMIT=")
    expect(build).toContain("BUILD_TIME=")
    expect(build).toContain("packages/app/dist/zingpop-build.json")
  })

  test("production workbench build verifies user-facing UX markers before install", async () => {
    const build = await Bun.file(new URL("scripts/production-build.sh", repo)).text()
    const probe = await Bun.file(new URL("scripts/production-ux-probe.mjs", repo)).text()

    expect(build).toContain("scripts/production-ux-probe.mjs")
    expect(build).toContain("--expected-commit")
    expect(build).toContain("--skip-remote")
    expect(probe).toContain("session-progress-narrative")
    expect(probe).toContain("userFacingAssistantOutput")
    expect(probe).toContain("session-turn-raw-details-toggle")
    expect(probe).toContain("正在准备 HTML 预览")
  })

  test("installer enables the production Nginx app and product hosts", async () => {
    const install = await Bun.file(new URL("scripts/install-systemd.sh", repo)).text()

    expect(install).toContain("/etc/nginx/sites-available")
    expect(install).toContain("/etc/nginx/sites-enabled")
    expect(install).toContain("deploy/nginx/zingpop-app.conf")
    expect(install).toContain("deploy/nginx/zingpop-www.conf")
    expect(install).toContain("/etc/nginx/sites-available/zingpop-app.conf")
    expect(install).toContain("/etc/nginx/sites-enabled/zingpop-app.conf")
    expect(install).toContain("/etc/nginx/sites-available/zingpop-www.conf")
    expect(install).toContain("/etc/nginx/sites-enabled/zingpop-www.conf")
  })

  test("server deploy script falls back to GitHub codeload and verifies production UX", async () => {
    const deploy = await Bun.file(new URL("scripts/deploy-production-from-github.sh", repo)).text()

    expect(deploy).toContain("git -C \"$REPO\"")
    expect(deploy).toContain("https://codeload.github.com/$GITHUB_REPO/tar.gz/$COMMIT")
    expect(deploy).toContain("tar -xzf \"$archive\" -C \"$workdir\" --strip-components=1")
    expect(deploy).toContain("ZINGPOP_BUILD_COMMIT=\"$COMMIT\"")
    expect(deploy).toContain("./scripts/production-build.sh")
    expect(deploy).toContain("./scripts/install-systemd.sh")
    expect(deploy).toContain("systemctl restart zingpop-opencode zingpop-console")
    expect(deploy).toContain("scripts/production-ux-probe.mjs")
    expect(deploy).toContain("DEPLOY_DONE $COMMIT")
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
    expect(install).toContain("cd packages/app")
    expect(install).toContain("tailwindcss/theme.css")
    expect(install).toContain("cd packages/ui")
    expect(install).toContain("@tsconfig/node22/tsconfig.json")
    expect(install).toContain("katex/dist/katex.min.css")
  })
})
