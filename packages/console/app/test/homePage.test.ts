import { describe, expect, test } from "bun:test"
import { homePage } from "../src/lib/home-page"

describe("home page", () => {
  test("uses Zingpop branding, safe entry links, and product sections", () => {
    expect(homePage.title).toBe("Zingpop")
    expect(homePage.eyebrow).toBe("Built for teams shipping inside China")
    expect(homePage.description).toContain("短信登录")
    expect(homePage.sectionTitle).toBe("先把核心链路跑通")
    expect(homePage.sectionBody).toContain("登录、支付、模型调用")
    expect(homePage.links).toEqual([
      { href: "/auth/phone", labelKey: "nav.login", primary: true },
      { href: "/docs", labelKey: "nav.docs", primary: false },
      { href: "/enterprise", labelKey: "nav.enterprise", primary: false },
    ])
    expect(homePage.highlights).toHaveLength(3)
    expect(homePage.steps).toHaveLength(3)
  })
})
