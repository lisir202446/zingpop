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
      <Meta name="description" content={i18n.t(homePage.descriptionKey)} />
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

        <div style="display: grid; gap: 24px; max-width: 680px;">
          <span
            style="display: inline-flex; width: fit-content; align-items: center; border: 1px solid #171717; padding: 8px 12px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;"
          >
            {homePage.title}
          </span>
          <h1 style="margin: 0; font-size: clamp(48px, 10vw, 92px); line-height: 0.96; letter-spacing: -0.06em;">
            {homePage.title}
          </h1>
          <p style="margin: 0; font-size: 20px; line-height: 1.7; max-width: 560px; color: #4b5563;">
            {i18n.t(homePage.descriptionKey)}
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
                {i18n.t(link.labelKey)}
              </A>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
