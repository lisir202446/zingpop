import { afterEach, describe, expect, test } from "bun:test"
import { authSuccessRedirectLocation } from "../src/lib/workbench-redirect"

const previous = {
  app: process.env.ZINGPOP_APP_DOMAIN,
  domain: process.env.ZINGPOP_DOMAIN,
  root: process.env.ZINGPOP_WORKSPACE_ROOT,
  dir: process.env.ZINGPOP_DEFAULT_WORKSPACE_DIR,
}

function restore(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
    return
  }
  process.env[name] = value
}

afterEach(() => {
  restore("ZINGPOP_APP_DOMAIN", previous.app)
  restore("ZINGPOP_DOMAIN", previous.domain)
  restore("ZINGPOP_WORKSPACE_ROOT", previous.root)
  restore("ZINGPOP_DEFAULT_WORKSPACE_DIR", previous.dir)
})

describe("workbench auth redirects", () => {
  test("defaults production auth success to the embedded workbench prompts page", () => {
    process.env.ZINGPOP_APP_DOMAIN = "app.zingpop.cn"
    process.env.ZINGPOP_WORKSPACE_ROOT = "/srv/zingpop/workspaces"
    delete process.env.ZINGPOP_DEFAULT_WORKSPACE_DIR

    expect(authSuccessRedirectLocation(new Request("https://www.zingpop.cn/auth/phone"), "", "/workspace/wrk_123/home")).toBe(
      "https://app.zingpop.cn/L3Nydi96aW5ncG9wL3dvcmtzcGFjZXMvZGVmYXVsdA/prompts",
    )
  })

  test("allows app host continue targets from the workbench auth gate", () => {
    process.env.ZINGPOP_DOMAIN = "www.zingpop.cn"
    process.env.ZINGPOP_APP_DOMAIN = "app.zingpop.cn"

    expect(
      authSuccessRedirectLocation(
        new Request("https://www.zingpop.cn/auth/phone"),
        "https://app.zingpop.cn/L3Nydi96aW5ncG9wL3dvcmtzcGFjZXMvZGVmYXVsdA/prompts",
        "/workspace/wrk_123/home",
      ),
    ).toBe("https://app.zingpop.cn/L3Nydi96aW5ncG9wL3dvcmtzcGFjZXMvZGVmYXVsdA/prompts")
  })

  test("rejects external continue targets", () => {
    process.env.ZINGPOP_APP_DOMAIN = "app.zingpop.cn"
    process.env.ZINGPOP_WORKSPACE_ROOT = "/srv/zingpop/workspaces"

    expect(
      authSuccessRedirectLocation(new Request("https://www.zingpop.cn/auth/phone"), "https://example.com/phish", "/workspace/wrk_123/home"),
    ).toBe("https://app.zingpop.cn/L3Nydi96aW5ncG9wL3dvcmtzcGFjZXMvZGVmYXVsdA/prompts")
  })

  test("keeps the console fallback when no app domain is configured", () => {
    delete process.env.ZINGPOP_APP_DOMAIN
    delete process.env.ZINGPOP_WORKSPACE_ROOT
    delete process.env.ZINGPOP_DEFAULT_WORKSPACE_DIR

    expect(authSuccessRedirectLocation(new Request("https://www.zingpop.cn/auth/phone"), "", "/workspace/wrk_123/home")).toBe(
      "/workspace/wrk_123/home",
    )
  })
})
