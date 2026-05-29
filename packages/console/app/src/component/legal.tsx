import { A } from "@solidjs/router"
import { LanguagePicker } from "~/component/language-picker"
import { useI18n } from "~/context/i18n"
import { useLanguage } from "~/context/language"

export function Legal() {
  const i18n = useI18n()
  const language = useLanguage()
  return (
    <div data-component="legal">
      <span>
        {"\u00A9"}
        {new Date().getFullYear()} <A href={language.route("/")}>Zingpop</A>
      </span>
      <span>
        <A href={language.route("/brand")}>{i18n.t("legal.brand")}</A>
      </span>
      <span>
        <A href={language.route("/legal/privacy-policy")}>{i18n.t("legal.privacy")}</A>
      </span>
      <span>
        <A href={language.route("/legal/terms-of-service")}>{i18n.t("legal.terms")}</A>
      </span>
      <span>
        <A href={language.route("/legal/data-processing")}>{i18n.t("legal.dataProcessing")}</A>
      </span>
      <span>
        <A href={language.route("/legal/third-party-disclosures")}>{i18n.t("legal.thirdParty")}</A>
      </span>
      <span>
        <A href={language.route("/legal/account-deletion")}>{i18n.t("legal.accountDeletion")}</A>
      </span>
      <span>
        <A href={language.route("/legal/open-source-notices")}>{i18n.t("legal.openSource")}</A>
      </span>
      <span>
        <a
          href="https://beian.mps.gov.cn/#/query/webSearch?code=44010602015865"
          rel="noreferrer"
          target="_blank"
        >
          <img src="/beian-police.png" alt="" width="14" height="14" style={{ "vertical-align": "-2px", "margin-right": "4px" }} />
          粤公网安备44010602015865号
        </a>
      </span>
      <span>
        <LanguagePicker align="right" />
      </span>
    </div>
  )
}
