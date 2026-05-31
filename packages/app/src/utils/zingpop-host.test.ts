import { describe, expect, test } from "bun:test"
import { shouldUseZingpopHostedWorkbench } from "./zingpop-host"

describe("zingpop hosted workbench detection", () => {
  test("treats the production app hostname as hosted", () => {
    expect(shouldUseZingpopHostedWorkbench({ hostname: "app.zingpop.cn", env: {} })).toBe(true)
    expect(shouldUseZingpopHostedWorkbench({ hostname: "APP.ZINGPOP.CN", env: {} })).toBe(true)
  })

  test("lets the production build force hosted mode outside app.zingpop.cn", () => {
    expect(
      shouldUseZingpopHostedWorkbench({
        hostname: "127.0.0.1",
        env: { VITE_ZINGPOP_HOSTED_WORKBENCH: "1" },
      }),
    ).toBe(true)
  })

  test("keeps local opencode on the original project picker branch", () => {
    expect(shouldUseZingpopHostedWorkbench({ hostname: "localhost", env: {} })).toBe(false)
    expect(shouldUseZingpopHostedWorkbench({ hostname: "127.0.0.1", env: {} })).toBe(false)
  })
})
