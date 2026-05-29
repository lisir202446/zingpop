import { describe, expect, test } from "bun:test"

const pages = [
  {
    route: "terms-of-service",
    title: "\u670d\u52a1\u6761\u6b3e",
  },
  {
    route: "privacy-policy",
    title: "\u9690\u79c1\u653f\u7b56",
  },
  {
    route: "data-processing",
    title: "\u6570\u636e\u5904\u7406\u8bf4\u660e",
  },
  {
    route: "third-party-disclosures",
    title: "\u7b2c\u4e09\u65b9\u670d\u52a1\u62ab\u9732",
  },
  {
    route: "account-deletion",
    title: "\u8d26\u53f7\u6ce8\u9500\u4e0e\u6570\u636e\u5220\u9664",
  },
  {
    route: "open-source-notices",
    title: "\u5f00\u6e90\u4e0e\u7b2c\u4e09\u65b9\u58f0\u660e",
  },
] as const

const mojibake = /闅愮|鏉℃|銆婇|涓|鍥藉|浣犵|鐢ㄦ|绗/

describe("public legal pages", () => {
  test("publish the required commercialization legal routes", async () => {
    for (const page of pages) {
      const file = Bun.file(new URL(`./${page.route}/index.tsx`, import.meta.url))

      expect(await file.exists()).toBe(true)
      expect(await file.text()).toContain(page.title)
      expect(await file.text()).toContain("Zingpop")
    }
  })

  test("link the required legal routes from the shared legal footer", async () => {
    const source = await Bun.file(new URL("../../component/legal.tsx", import.meta.url)).text()

    for (const page of pages) {
      expect(source).toContain(`/legal/${page.route}`)
    }
  })

  test("publish the required public security bureau filing link and icon", async () => {
    const source = await Bun.file(new URL("../../component/legal.tsx", import.meta.url)).text()

    expect(source).toContain("https://beian.mps.gov.cn/#/query/webSearch?code=44010602015865")
    expect(source).toContain("\u7ca4\u516c\u7f51\u5b89\u590744010602015865\u53f7")
    expect(source).toContain("/beian-police.png")
    expect(await Bun.file(new URL("../../../public/beian-police.png", import.meta.url)).exists()).toBe(true)
  })

  test("do not ship garbled chinese legal copy", async () => {
    for (const page of pages) {
      expect(await Bun.file(new URL(`./${page.route}/index.tsx`, import.meta.url)).text()).not.toMatch(mojibake)
    }
  })
})
