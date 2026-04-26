import "./index.css"
import { createAsync, query } from "@solidjs/router"
import { Title, Meta } from "@solidjs/meta"
//import { HttpHeader } from "@solidjs/start"
import zenLogoLight from "../../asset/zen-ornate-light.svg"
import zenLogoDark from "../../asset/zen-ornate-dark.svg"
import { EmailSignup } from "~/component/email-signup"
import { Faq } from "~/component/faq"
import { Legal } from "~/component/legal"
import { Footer } from "~/component/footer"
import { Header } from "~/component/header"
import { getLastSeenWorkspaceID } from "../workspace/common"
import { IconAlibaba, IconMiniMax, IconMiMo, IconMoonshotAI, IconZai } from "~/component/icon"
import { useI18n } from "~/context/i18n"
import { useLanguage } from "~/context/language"
import { LocaleLinks } from "~/component/locale-links"

const checkLoggedIn = query(async () => {
  "use server"
  return await getLastSeenWorkspaceID().catch(() => {})
}, "checkLoggedIn.get")

export default function Home() {
  const loggedin = createAsync(() => checkLoggedIn())
  const i18n = useI18n()
  const language = useLanguage()
  return (
    <main data-page="zen">
      {/*<HttpHeader name="Cache-Control" value="public, max-age=1, s-maxage=3600, stale-while-revalidate=86400" />*/}
      <Title>{i18n.t("zen.title")}</Title>
      <LocaleLinks path="/zen" />
      <Meta property="og:image" content="/social-share-zen.png" />
      <Meta name="twitter:image" content="/social-share-zen.png" />
      <Meta name="opencode:auth" content={loggedin() ? "true" : "false"} />

      <div data-component="container">
        <Header zen hideGetStarted />

        <div data-component="content">
          <section data-component="hero">
            <div data-slot="hero-copy">
              <img data-slot="zen logo light" src={zenLogoLight} alt="" />
              <img data-slot="zen logo dark" src={zenLogoDark} alt="" />
              <h1>{i18n.t("zen.hero.title")}</h1>
              <p>{i18n.t("zen.hero.body")}</p>
              <div data-slot="model-logos">
                <div>
                  <IconMoonshotAI width="24" height="24" />
                </div>
                <div>
                  <IconZai width="24" height="24" />
                </div>
                <div>
                  <IconAlibaba width="24" height="24" />
                </div>
                <div>
                  <IconMiniMax width="24" height="24" />
                </div>
                <div>
                  <IconMiMo width="24" height="24" />
                </div>
              </div>
              <a href="/auth">
                <span>{i18n.t("zen.cta.start")}</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M6.5 12L17 12M13 16.5L17.5 12L13 7.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="square"
                  />
                </svg>
              </a>
            </div>
            <div data-slot="pricing-copy">
              <p>
                <strong>{i18n.t("zen.pricing.title")}</strong> <span>{i18n.t("zen.pricing.fee")}</span>
              </p>
              <p>{i18n.t("zen.pricing.body")}</p>
            </div>
          </section>

          <section data-component="comparison">
            <div data-component="zingpop-demo" aria-label={i18n.t("zen.demo.aria")}>
              <div data-slot="demo-top">
                <strong>Zingpop</strong>
                <span>Zen</span>
              </div>
              <div data-slot="demo-body">
                <div data-slot="demo-chat">
                  <p data-kind="user">{i18n.t("zen.demo.prompt")}</p>
                  <p data-kind="assistant">{i18n.t("zen.demo.plan")}</p>
                  <p data-kind="assistant">{i18n.t("zen.demo.done")}</p>
                </div>
                <div data-slot="demo-preview">
                  <div data-slot="preview-window">
                    <span>{i18n.t("zen.demo.previewBadge")}</span>
                    <strong>{i18n.t("zen.demo.previewTitle")}</strong>
                    <p>{i18n.t("zen.demo.previewBody")}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section data-component="problem">
            <div data-slot="section-title">
              <h3>{i18n.t("zen.problem.title")}</h3>
              <p>{i18n.t("zen.problem.body")}</p>
            </div>
            <p>{i18n.t("zen.problem.subtitle")}</p>
            <ul>
              <li>
                <span>[*]</span> {i18n.t("zen.problem.item1")}
              </li>
              <li>
                <span>[*]</span> {i18n.t("zen.problem.item2")}
              </li>
              <li>
                <span>[*]</span> {i18n.t("zen.problem.item3")}
              </li>
            </ul>
          </section>

          <section data-component="how">
            <div data-slot="section-title">
              <h3>{i18n.t("zen.how.title")}</h3>
              <p>{i18n.t("zen.how.body")}</p>
            </div>
            <ul>
              <li>
                <span>[1]</span>
                <div>
                  <strong>{i18n.t("zen.how.step1.title")}</strong> - {i18n.t("zen.how.step1.beforeLink")}{" "}
                  <a href={language.route("/docs/zen/#how-it-works")} title={i18n.t("zen.how.step1.link")}>
                    {i18n.t("zen.how.step1.link")}
                  </a>
                </div>
              </li>
              <li>
                <span>[2]</span>
                <div>
                  <strong>{i18n.t("zen.how.step2.title")}</strong> -{" "}
                  <a href={language.route("/docs/zen/#pricing")}>{i18n.t("zen.how.step2.link")}</a>{" "}
                  {i18n.t("zen.how.step2.afterLink")}
                </div>
              </li>
              <li>
                <span>[3]</span>
                <div>
                  <strong>{i18n.t("zen.how.step3.title")}</strong> - {i18n.t("zen.how.step3.body")}
                </div>
              </li>
            </ul>
          </section>

          <section data-component="privacy">
            <div data-slot="privacy-title">
              <h3>{i18n.t("zen.privacy.title")}</h3>
              <div>
                <span>[*]</span>
                <p>
                  {i18n.t("zen.privacy.beforeExceptions")}{" "}
                  <a href={language.route("/docs/zen/#privacy")}>{i18n.t("zen.privacy.exceptionsLink")}</a>.
                </p>
              </div>
            </div>
          </section>

          <section data-component="testimonials">
            <article data-slot="testimonial">
              <div data-slot="name">
                <span data-slot="avatar">陈</span>
                <strong>陈老师</strong>
                <span>少儿编程启蒙老师</span>
              </div>
              <div data-slot="quote">
                <span>Zingpop Zen</span>
                {" 让我不用解释一堆模型参数，学生直接按中文描述就能看到作品成形。"}
              </div>
            </article>
            <article data-slot="testimonial">
              <div data-slot="name">
                <span data-slot="avatar">林</span>
                <strong>林同学</strong>
                <span>独立产品学习者</span>
              </div>
              <div data-slot="quote">
                {"以前卡在配置和额度上，现在用 "}
                <span>Zingpop Zen</span>
                {" 就能稳定把想法做成页面，支付也不用折腾外币卡。"}
              </div>
            </article>
            <article data-slot="testimonial">
              <div data-slot="name">
                <span data-slot="avatar">周</span>
                <strong>周店长</strong>
                <span>本地生活小店经营者</span>
              </div>
              <div data-slot="quote">
                {"我只会描述需求，"}
                <span>Zingpop Zen</span>
                {" 帮我把活动页、文案和小工具一步步搭出来，真的像请了一个懂中文的产品助手。"}
              </div>
            </article>
          </section>

          <section data-component="faq">
            <div data-slot="section-title">
              <h3>{i18n.t("common.faq")}</h3>
            </div>
            <ul>
              <li>
                <Faq question={i18n.t("zen.faq.q1")}>{i18n.t("zen.faq.a1")}</Faq>
              </li>
              <li>
                <Faq question={i18n.t("zen.faq.q2")}>{i18n.t("zen.faq.a2")}</Faq>
              </li>
              <li>
                <Faq question={i18n.t("zen.faq.q3")}>{i18n.t("zen.faq.a3")}</Faq>
              </li>
              <li>
                <Faq question={i18n.t("zen.faq.q4")}>
                  {i18n.t("zen.faq.a4.p1.beforePricing")}{" "}
                  <a href={language.route("/docs/zen/#pricing")}>{i18n.t("zen.faq.a4.p1.pricingLink")}</a>{" "}
                  {i18n.t("zen.faq.a4.p1.afterPricing")} {i18n.t("zen.faq.a4.p2.beforeAccount")}{" "}
                  <a href="/auth">{i18n.t("zen.faq.a4.p2.accountLink")}</a>. {i18n.t("zen.faq.a4.p3")}
                </Faq>
              </li>
              <li>
                <Faq question={i18n.t("zen.faq.q5")}>
                  {i18n.t("zen.faq.a5.beforeExceptions")}{" "}
                  <a href={language.route("/docs/zen/#privacy")}>{i18n.t("zen.faq.a5.exceptionsLink")}</a>.
                </Faq>
              </li>
              <li>
                <Faq question={i18n.t("zen.faq.q6")}>{i18n.t("zen.faq.a6")}</Faq>
              </li>
              <li>
                <Faq question={i18n.t("zen.faq.q7")}>{i18n.t("zen.faq.a7")}</Faq>
              </li>
              <li>
                <Faq question={i18n.t("zen.faq.q8")}>{i18n.t("zen.faq.a8")}</Faq>
              </li>
            </ul>
          </section>

          <EmailSignup />

          <Footer />
        </div>
      </div>

      <Legal />
    </main>
  )
}
