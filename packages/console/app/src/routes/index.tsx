import { Meta, Title } from "@solidjs/meta"
import { A } from "@solidjs/router"
import { useI18n } from "~/context/i18n"
import { useLanguage } from "~/context/language"
import { homePage } from "~/lib/home-page"

export default function Home() {
  const i18n = useI18n()
  const language = useLanguage()

  return (
    <main
      data-page="zingpop-home"
      style="min-height: 100vh; background: linear-gradient(180deg, #fffaf0 0%, #ffffff 100%); color: #171717;"
    >
      <Title>{homePage.title}</Title>
      <Meta name="description" content={homePage.description} />
      <section style="width: min(100%, 1080px); margin: 0 auto; padding: 32px 20px 96px;">
        <div
          style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 96px;"
        >
          <A
            href={language.route("/")}
            style="font-size: 40px; font-weight: 800; letter-spacing: -0.04em; color: inherit; text-decoration: none;"
          >
            {homePage.title}
          </A>
          <nav style="display: flex; gap: 24px; flex-wrap: wrap; align-items: center;">
            {homePage.links
              .filter((link) => !link.primary)
              .map((link) => (
                <A href={language.route(link.href)} style="color: inherit; text-decoration: none; font-size: 16px;">
                  {i18n.t(link.labelKey)}
                </A>
              ))}
          </nav>
        </div>

        <div style="display: grid; gap: 24px; max-width: 720px; margin-bottom: 80px;">
          <span
            style="display: inline-flex; width: fit-content; align-items: center; border: 1px solid #171717; padding: 8px 12px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;"
          >
            {homePage.eyebrow}
          </span>
          <h1 style="margin: 0; font-size: clamp(48px, 10vw, 92px); line-height: 0.96; letter-spacing: -0.06em;">
            {homePage.title}
          </h1>
          <p style="margin: 0; font-size: 20px; line-height: 1.7; max-width: 560px; color: #4b5563;">
            {homePage.description}
          </p>
          <div style="display: flex; gap: 16px; flex-wrap: wrap; padding-top: 12px;">
            {homePage.links.map((link) => (
              <A
                href={language.route(link.href)}
                style={
                  link.primary
                    ? "display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 20px; background: #171717; color: white; text-decoration: none; font-weight: 600;"
                    : "display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 20px; border: 1px solid #171717; color: #171717; text-decoration: none; font-weight: 600;"
                }
              >
                {link.primary ? "登录" : link.labelKey === "nav.docs" ? "文档" : "企业版"}
              </A>
            ))}
          </div>
        </div>

        <section
          style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 72px;"
        >
          {homePage.highlights.map((item) => (
            <article style="border: 1px solid #e5e7eb; background: rgba(255,255,255,0.8); padding: 24px; display: grid; gap: 12px;">
              <h2 style="margin: 0; font-size: 24px; line-height: 1.2;">{item.title}</h2>
              <p style="margin: 0; color: #4b5563; line-height: 1.7;">{item.body}</p>
            </article>
          ))}
        </section>

        <section style="display: grid; gap: 20px;">
          <div style="display: grid; gap: 8px; max-width: 620px;">
            <h2 style="margin: 0; font-size: clamp(28px, 4vw, 40px); line-height: 1.05;">{homePage.sectionTitle}</h2>
            <p style="margin: 0; color: #4b5563; line-height: 1.7;">{homePage.sectionBody}</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
            {homePage.steps.map((item, index) => (
              <article style="border-top: 2px solid #171717; padding-top: 16px; display: grid; gap: 10px;">
                <span style="font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280;">
                  0{index + 1}
                </span>
                <h3 style="margin: 0; font-size: 20px; line-height: 1.3;">{item.title}</h3>
                <p style="margin: 0; color: #4b5563; line-height: 1.7;">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
