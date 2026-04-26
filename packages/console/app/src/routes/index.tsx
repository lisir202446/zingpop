import "./index.css"
import { Meta, Title } from "@solidjs/meta"
import { A } from "@solidjs/router"
import caseArt from "../asset/home/case-art.png"
import caseGame from "../asset/home/case-game.png"
import caseSite from "../asset/home/case-site.png"
import caseTool from "../asset/home/case-tool.png"
import { EmailSignup } from "~/component/email-signup"
import { Faq } from "~/component/faq"
import { Footer } from "~/component/footer"
import { Header } from "~/component/header"
import { Legal } from "~/component/legal"
import { LocaleLinks } from "~/component/locale-links"
import { useI18n } from "~/context/i18n"
import { useLanguage } from "~/context/language"

const caseIDs = ["game", "site", "tool", "art"] as const
const philosophyIDs = ["skill", "prompt", "context", "plugin", "mcp"] as const
const capabilityIDs = ["multiSession", "workspace", "share", "models", "surfaces", "handoff"] as const
const starterIDs = ["starter", "guided", "ship"] as const
const stepIDs = ["enter", "pick", "polish"] as const
const faqIDs = [1, 2, 3, 4, 5, 6] as const
const caseImages = {
  game: caseGame,
  site: caseSite,
  tool: caseTool,
  art: caseArt,
} as const

export default function Home() {
  const i18n = useI18n()
  const language = useLanguage()
  const authHref = language.route("/auth/phone")

  const renderCasePreview = (caseID: (typeof caseIDs)[number]) => (
    <div data-slot="case-window" data-case={caseID}>
      <div data-slot="case-toolbar">
        <span />
        <span />
        <span />
      </div>
      <div data-slot="case-body">
        <div data-slot="case-sidebar">
          <span data-slot="case-pill">{i18n.t(`home.cases.${caseID}.tag1`)}</span>
          <span data-slot="case-pill">{i18n.t(`home.cases.${caseID}.tag2`)}</span>
          <span data-slot="case-pill">{i18n.t(`home.cases.${caseID}.tag3`)}</span>
        </div>
        <div data-slot="case-canvas">
          <div data-slot="case-image-frame">
            <img
              data-slot="case-image"
              src={caseImages[caseID]}
              alt={i18n.t(`home.cases.${caseID}.title`)}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <main data-page="opencode">
      <Title>{i18n.t("home.title")}</Title>
      <Meta name="description" content={i18n.t("home.meta.description")} />
      <LocaleLinks path="/" />
      <Meta property="og:image" content="/social-share.png" />
      <Meta name="twitter:image" content="/social-share.png" />
      <div data-component="container">
        <Header hideEnterprise ctaHref={authHref} ctaLabel={i18n.t("home.hero.primary")} />

        <div data-component="content">
          <section data-component="hero">
            <div data-component="desktop-app-banner">
              <span data-slot="badge">{i18n.t("home.banner.badge")}</span>
              <div data-slot="content">
                <span data-slot="text">
                  {i18n.t("home.banner.text")}
                  <span data-slot="platforms"> {i18n.t("home.banner.platforms")}</span>.
                </span>
                <a href="#cases" data-slot="link">
                  {i18n.t("home.banner.link")}
                </a>
                <a href="#cases" data-slot="link-mobile">
                  {i18n.t("home.banner.linkMobile")}
                </a>
              </div>
            </div>

            <div data-slot="hero-copy">
              <h1>{i18n.t("home.hero.title")}</h1>
              <p>
                {i18n.t("home.hero.subtitle.a")} <span data-slot="br"></span>
                {i18n.t("home.hero.subtitle.b")}
              </p>
              <div data-slot="hero-positioning">
                <p>{i18n.t("home.hero.positioning.comparison")}</p>
                <p>{i18n.t("home.hero.positioning.zingpop")}</p>
              </div>
              <div data-slot="hero-actions">
                <A href={authHref}>{i18n.t("home.hero.primary")}</A>
                <a href="#cases" data-slot="secondary-action">
                  {i18n.t("home.hero.secondary")}
                </a>
              </div>
              <p data-slot="hero-note">{i18n.t("home.hero.note")}</p>
            </div>

            <div data-slot="starter-board">
              <div data-slot="starter-header">
                <strong>{i18n.t("home.workspace.title")}</strong>
                <span>{i18n.t("home.workspace.eyebrow")}</span>
              </div>
              <div data-slot="starter-list">
                {starterIDs.map((starterID) => (
                  <div data-slot="starter-item">
                    <div data-slot="starter-copy">
                      <span data-slot="starter-tag">{i18n.t(`home.workspace.${starterID}.tag`)}</span>
                      <strong>{i18n.t(`home.workspace.${starterID}.title`)}</strong>
                      <p>{i18n.t(`home.workspace.${starterID}.body`)}</p>
                    </div>
                    <span data-slot="starter-action">{i18n.t("home.workspace.action")}</span>
                  </div>
                ))}
              </div>
              <div data-slot="starter-footer">
                {philosophyIDs.map((philosophyID) => (
                  <span data-slot="starter-pill">{i18n.t(`home.philosophy.${philosophyID}.title`)}</span>
                ))}
              </div>
            </div>
          </section>

          <section data-component="cases" id="cases">
            <div data-slot="section-title">
              <h3>{i18n.t("home.cases.title")}</h3>
              <div>
                <span>[*]</span>
                <p>{i18n.t("home.cases.body")}</p>
              </div>
            </div>
            <div data-slot="case-grid">
              {caseIDs.map((caseID) => (
                <article data-component="case-card">
                  {renderCasePreview(caseID)}
                  <div data-slot="case-copy">
                    <div data-slot="case-copy-top">
                      <strong>{i18n.t(`home.cases.${caseID}.title`)}</strong>
                      <span>{i18n.t(`home.cases.${caseID}.eyebrow`)}</span>
                    </div>
                    <p>{i18n.t(`home.cases.${caseID}.body`)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section data-component="what">
            <div data-slot="section-title">
              <h3>{i18n.t("home.philosophy.title")}</h3>
              <div>
                <span>[*]</span>
                <p>{i18n.t("home.philosophy.body")}</p>
              </div>
            </div>
            <ul>
              {philosophyIDs.map((philosophyID) => (
                <li>
                  <span>[*]</span>
                  <div>
                    <strong>{i18n.t(`home.philosophy.${philosophyID}.title`)}</strong>
                    {i18n.t(`home.philosophy.${philosophyID}.body`)}
                  </div>
                </li>
              ))}
            </ul>
            <A href={authHref}>
              <span>{i18n.t("home.philosophy.cta")}</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.5 12L17 12M13 16.5L17.5 12L13 7.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="square"
                />
              </svg>
            </A>
          </section>

          <section data-component="capabilities">
            <div data-slot="section-title">
              <h3>{i18n.t("home.capabilities.title")}</h3>
              <div>
                <span>[*]</span>
                <p>{i18n.t("home.capabilities.body")}</p>
              </div>
            </div>
            <div data-slot="capability-grid">
              {capabilityIDs.map((capabilityID, index) => (
                <article data-slot="capability-card">
                  <span data-slot="capability-index">0{index + 1}</span>
                  <strong>{i18n.t(`home.capabilities.${capabilityID}.title`)}</strong>
                  <p>{i18n.t(`home.capabilities.${capabilityID}.body`)}</p>
                </article>
              ))}
            </div>
          </section>

          <section data-component="steps">
            <div data-slot="section-title">
              <h3>{i18n.t("home.steps.title")}</h3>
              <div>
                <span>[*]</span>
                <p>{i18n.t("home.steps.body")}</p>
              </div>
            </div>
            <div data-slot="step-grid">
              {stepIDs.map((stepID, index) => (
                <article data-slot="step-card">
                  <span data-slot="step-index">0{index + 1}</span>
                  <strong>{i18n.t(`home.steps.${stepID}.title`)}</strong>
                  <p>{i18n.t(`home.steps.${stepID}.body`)}</p>
                </article>
              ))}
            </div>
          </section>

          <section data-component="faq">
            <div data-slot="section-title">
              <h3>{i18n.t("common.faq")}</h3>
            </div>
            <ul>
              {faqIDs.map((faqID) => (
                <li>
                  <Faq question={i18n.t(`home.faq.q${faqID}`)}>{i18n.t(`home.faq.a${faqID}`)}</Faq>
                </li>
              ))}
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
