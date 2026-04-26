import { describe, expect, test } from "bun:test"
import { dict as zh } from "./zh"

const read = (path: string) => Bun.file(new URL(path, import.meta.url)).text()

describe("domestic market surfaces", () => {
  test("top and footer navigation do not show foreign social or enterprise links", async () => {
    const header = await read("../component/header.tsx")
    const footer = await read("../component/footer.tsx")

    expect(header).not.toContain("config.github.repoUrl")
    expect(header).not.toContain('i18n.t("nav.github")')
    expect(header).not.toContain('i18n.t("nav.enterprise")')
    expect(footer).not.toContain("config.github.repoUrl")
    expect(footer).not.toContain("config.social.twitter")
    expect(footer).not.toContain('i18n.t("footer.github")')
    expect(footer).not.toContain('i18n.t("footer.x")')
  })

  test("zen page uses domestic payment, privacy, testimonials, and a Zingpop demo", async () => {
    const source = await read("../routes/zen/index.tsx")
    const css = await read("../routes/zen/index.css")
    const copy = [
      zh["zen.pricing.title"],
      zh["zen.pricing.fee"],
      zh["zen.pricing.body"],
      zh["zen.how.body"],
      zh["zen.how.step1.title"],
      zh["zen.how.step3.body"],
      zh["zen.privacy.beforeExceptions"],
      zh["zen.faq.a5.beforeExceptions"],
    ].join("\n")

    expect(copy).toContain("\u652f\u4ed8\u5b9d")
    expect(copy).toContain("\u5fae\u4fe1")
    expect(copy).toContain("\u4eba\u6c11\u5e01")
    expect(copy).toContain("\u56fd\u5185")
    expect(copy).not.toContain("$")
    expect(copy).not.toContain("\u7f8e\u56fd")
    expect(source).not.toContain("<video")
    expect(source).not.toContain("opencode-comparison")
    expect(source).not.toContain("https://x.com")
    expect(source).not.toContain("Dax Raad")
    expect(source).toContain('data-component="zingpop-demo"')
    expect(css).toContain('[data-component="zingpop-demo"]')
  })

  test("go page pricing and how-it-works copy is domestic", () => {
    const copy = [
      zh["go.meta.description"],
      zh["go.cta.price"],
      zh["go.cta.promo"],
      zh["go.pricing.body"],
      zh["go.problem.body"],
      zh["go.how.body"],
      zh["go.how.step2.link"],
      zh["go.how.step2.afterLink"],
      zh["go.privacy.body"],
      zh["go.faq.a5.body"],
    ].join("\n")

    expect(copy).toContain("\u652f\u4ed8\u5b9d")
    expect(copy).toContain("\u5fae\u4fe1")
    expect(copy).toContain("\u4eba\u6c11\u5e01")
    expect(copy).toContain("\u56fd\u5185")
    expect(copy).not.toContain("$")
    expect(copy).not.toContain("\u7f8e\u56fd")
    expect(copy).not.toContain("\u56fd\u9645\u7528\u6237")
  })

  test("email signup writes to the first-party backend instead of EmailOctopus", async () => {
    const source = await read("../component/email-signup.tsx")

    expect(source).toContain("GatewayKv")
    expect(source).toContain("waitlist:email:")
    expect(source).not.toContain("emailoctopus")
    expect(source).not.toContain("EMAILOCTOPUS_API_KEY")
  })

  test("email signup success copy matches backend capture", () => {
    expect(zh["email.success"]).toContain("\u5df2\u6536\u5230")
    expect(zh["email.success"]).not.toContain("\u6536\u4ef6\u7bb1")
    expect(zh["email.success"]).not.toContain("\u786e\u8ba4")
  })

  test("zen and workspace surfaces only present domestic model choices", async () => {
    const zen = await read("../routes/zen/index.tsx")
    const copy = [
      zh["zen.hero.body"],
      zh["workspace.newUser.feature.tested.body"],
      zh["workspace.newUser.feature.quality.body"],
      zh["workspace.newUser.feature.lockin.body"],
      zh["workspace.newUser.step.login.after"],
      zh["workspace.newUser.step.models.before"],
      zh["workspace.lite.subscription.selectProvider"],
      zh["workspace.lite.promo.description"],
      zh["workspace.lite.promo.footer"],
    ].join("\n")

    expect(zen).toContain("IconMoonshotAI")
    expect(zen).toContain("IconAlibaba")
    expect(zen).not.toContain("IconOpenAI")
    expect(zen).not.toContain("IconAnthropic")
    expect(zen).not.toContain("IconGemini")
    expect(copy).toContain("\u56fd\u5185")
    expect(copy).toContain("Zingpop")
    expect(copy).not.toContain("OpenCode")
    expect(copy).not.toContain("opencode")
    expect(copy).not.toContain("\u7f8e\u56fd")
    expect(copy).not.toContain("\u56fd\u9645\u7528\u6237")
  })

  test("legal footer and legal pages are first-party Zingpop documents", async () => {
    const footer = await read("../component/legal.tsx")
    const privacy = await read("../routes/legal/privacy-policy/index.tsx")
    const terms = await read("../routes/legal/terms-of-service/index.tsx")
    const source = [footer, privacy, terms].join("\n")

    expect(footer).toContain("Zingpop")
    expect(source).toContain("\u4e2a\u4eba\u4fe1\u606f\u4fdd\u62a4\u6cd5")
    expect(source).toContain("\u7f51\u7edc\u5b89\u5168\u6cd5")
    expect(source).not.toContain("Anomaly")
    expect(source).not.toContain("anoma.ly")
    expect(source).not.toContain("opencode.ai")
    expect(source).not.toContain("Delaware")
    expect(source).not.toContain("California")
    expect(source).not.toContain("Stripe")
  })

  test("docs brand and feishu are complete first-party pages", async () => {
    const docs = await read("../routes/docs/index.tsx")
    const docsCatchAll = await read("../routes/docs/[...path].tsx")
    const brand = await read("../routes/brand/index.tsx")
    const feishu = await read("../routes/feishu.tsx")
    const source = [docs, docsCatchAll, brand, feishu].join("\n")

    expect(docs).toContain('data-page="docs"')
    expect(docs).toContain('data-component="docs-content"')
    expect(brand).toContain('data-component="brand-system"')
    expect(feishu).toContain('data-page="community"')
    expect(feishu).toContain('data-component="community-content"')
    expect(source).toContain("Zingpop")
    expect(brand).not.toContain("opencode")
    expect(brand).not.toContain("OpenCode")
    expect(source).not.toContain("docs.opencode.ai")
    expect(source).not.toContain("docs.dev.opencode.ai")
    expect(source).not.toContain("brand.placeholder")
  })

  test("workspace inspiration page is a lightweight prompt layer with a broad visual gallery", async () => {
    const nav = await read("../routes/workspace/[id].tsx")
    const page = await read("../routes/workspace/[id]/inspiration.tsx")
    const css = await read("../routes/workspace/[id]/inspiration.css")

    expect(nav).toContain("/inspiration")
    expect(page).toContain('data-page="workspace-inspiration"')
    expect(page).toContain("const inspirations")
    expect(page).toContain("buildPrompt")
    expect(page).toContain("copyPrompt")
    expect(page).toContain("基于这个风格开始")
    expect(page).toContain("换一版")
    expect(page).toContain("换颜色")
    expect(page).toContain("做成 App")
    expect(page).toContain("做成官网")
    expect(page.match(/id: "/g)?.length ?? 0).toBeGreaterThanOrEqual(18)
    expect(page).not.toContain("variant.com")
    expect(page).not.toContain("Introducing Fig Mint")
    expect(css).toContain("grid-template-columns")
    expect(css).toContain("column-count")
  })
})
