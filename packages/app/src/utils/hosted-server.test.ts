import { describe, expect, test } from "bun:test"
import { defaultHostedServerUrl } from "./hosted-server"

describe("defaultHostedServerUrl", () => {
  test("uses the current origin on the hosted workbench instead of a stored server", () => {
    expect(
      defaultHostedServerUrl({
        hostname: "app.zingpop.cn",
        origin: "https://app.zingpop.cn",
        stored: "https://www.zingpop.cn",
        dev: false,
      }),
    ).toBe("https://app.zingpop.cn")
  })

  test("keeps the stored server outside the hosted workbench", () => {
    expect(
      defaultHostedServerUrl({
        hostname: "localhost",
        origin: "http://localhost:3001",
        stored: "http://127.0.0.1:4096",
        dev: true,
        devHost: "localhost",
        devPort: "4096",
      }),
    ).toBe("http://127.0.0.1:4096")
  })
})
