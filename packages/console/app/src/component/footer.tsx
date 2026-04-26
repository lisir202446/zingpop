import { useLanguage } from "~/context/language"
import { useI18n } from "~/context/i18n"

export function Footer() {
  const language = useLanguage()
  const i18n = useI18n()

  return (
    <footer data-component="footer">
      <div data-slot="cell">
        <a href={language.route("/docs")}>{i18n.t("footer.docs")}</a>
      </div>
      <div data-slot="cell">
        <a href={language.route("/changelog")}>{i18n.t("footer.changelog")}</a>
      </div>
      <div data-slot="cell">
        <a href={language.route("/feishu")}>{i18n.t("footer.feishu")}</a>
      </div>
      <div data-slot="cell">
        <a href={language.route("/brand")}>{i18n.t("legal.brand")}</a>
      </div>
      <div data-slot="cell">
        <a href={language.route("/auth")}>{i18n.t("nav.login")}</a>
      </div>
    </footer>
  )
}
