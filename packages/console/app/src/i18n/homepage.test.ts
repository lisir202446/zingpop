import { describe, expect, test } from "bun:test"
import { dict as en } from "./en"
import { dict as zh } from "./zh"
import { dict as zhHome } from "./zh-home"

describe("homepage content", () => {
  test("route uses the full homepage scaffold instead of the static home-page module", async () => {
    const source = await Bun.file(new URL("../routes/index.tsx", import.meta.url)).text()

    expect(source).not.toContain('~/lib/home-page')
    expect(source).toContain('import "./index.css"')
    expect(source).toContain("<Header")
    expect(source).toContain("<EmailSignup")
    expect(source).toContain("<Footer")
    expect(source).toContain("<Legal")
    expect(source).toContain('i18n.t("home.hero.title")')
    expect(source).toContain('data-slot="hero-positioning"')
    expect(source).toContain('i18n.t("home.hero.positioning.comparison")')
    expect(source).toContain('i18n.t("home.hero.positioning.zingpop")')
  })

  test("english homepage keys describe the beginner-first Zingpop homepage", () => {
    expect(en["home.title"]).toBe("Zingpop | Build your first product without a coding setup")
    expect(en["home.hero.primary"]).toBe("Start now")
    expect(en["home.hero.secondary"]).toBe("See what it can make")
    expect(en["home.cases.title"]).toBe("See what it can do")
    expect(en["home.philosophy.skill.title"]).toBe("skill")
    expect(en["home.workspace.title"]).toBe("Open the workspace and start from a ready-made move")
  })

  test("chinese homepage keys are readable and aligned with the new homepage", () => {
    const mergedZh = { ...zh, ...zhHome }

    expect(mergedZh["nav.docs"]).toBe("\u6587\u6863")
    expect(mergedZh["nav.enterprise"]).toBe("\u4f01\u4e1a\u7248")
    expect(mergedZh["nav.getStartedFree"]).toBe("\u514d\u8d39\u5f00\u59cb")
    expect(mergedZh["email.title"]).toBe("\u7b2c\u4e00\u65f6\u95f4\u77e5\u9053 Zingpop \u7684\u65b0\u80fd\u529b")
    expect(mergedZh["home.title"]).toBe("Zingpop | \u4e0d\u7528\u6298\u817e\u73af\u5883\uff0c\u4e5f\u80fd\u505a\u51fa\u4f60\u7684\u7b2c\u4e00\u4e2a\u4ea7\u54c1")
    expect(mergedZh["home.hero.primary"]).toBe("\u7acb\u5373\u5f00\u59cb")
    expect(mergedZh["home.hero.secondary"]).toBe("\u770b\u5b83\u80fd\u505a\u4ec0\u4e48")
    expect(mergedZh["home.hero.positioning.comparison"]).toBe("Claude Code / Cursor \u66f4\u50cf\u201c\u7ed9\u4f1a\u914d\u7f6e\u7684\u4eba\u4e00\u76d2\u5de5\u5177\u201d\u3002")
    expect(mergedZh["home.hero.positioning.zingpop"]).toBe(
      "Zingpop \u5e94\u8be5\u662f\u201c\u7528\u6237\u70b9\u4e00\u4e2a\u76ee\u6807\uff0c\u7cfb\u7edf\u81ea\u52a8\u9009 skill\u3001\u6a21\u578b\u3001\u5de5\u5177\u3001\u68c0\u67e5\u6b65\u9aa4\u201d\u3002",
    )
    expect(mergedZh["home.cases.title"]).toBe("\u770b\u5b83\u80fd\u505a\u4ec0\u4e48")
    expect(mergedZh["home.philosophy.prompt.title"]).toBe("prompt")
    expect(mergedZh["home.workspace.title"]).toBe("\u70b9\u5f00\u5de5\u4f5c\u53f0\uff0c\u5c31\u6709\u73b0\u6210\u7684\u8d77\u624b\u5f0f")
  })
})
