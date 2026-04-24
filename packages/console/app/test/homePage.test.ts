import { describe, expect, test } from "bun:test"
import { homePage } from "../src/lib/home-page"

describe("home page", () => {
  test("uses Zingpop branding and safe entry links", () => {
    expect(homePage.title).toBe("Zingpop")
    expect(homePage.links).toEqual([
      { href: "/auth/phone", labelKey: "nav.login", primary: true },
      { href: "/docs", labelKey: "nav.docs", primary: false },
      { href: "/enterprise", labelKey: "nav.enterprise", primary: false },
    ])
  })
})
