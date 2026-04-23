import { useParams, useAction, createAsync, useSubmission } from "@solidjs/router"
import { createMemo, Match, Show, Switch, createEffect } from "solid-js"
import { createStore } from "solid-js/store"
import { IconAlipay, IconCreditCard, IconStripe, IconUpi, IconWechat } from "~/component/icon"
import styles from "./billing-section.module.css"
import { createCheckoutUrl, formatBalance, queryBillingInfo } from "../../common"
import { useI18n } from "~/context/i18n"
import { localizeError } from "~/lib/form-error"

export function BillingSection() {
  const params = useParams()
  const i18n = useI18n()
  const billingInfo = createAsync(() => queryBillingInfo(params.id!))
  const checkoutAction = useAction(createCheckoutUrl)
  const checkoutSubmission = useSubmission(createCheckoutUrl)
  const [store, setStore] = createStore({
    showAddBalanceForm: false,
    addBalanceAmount: billingInfo()?.reloadAmount.toString() ?? "",
    checkoutRedirecting: false,
  })

  createEffect(() => {
    const info = billingInfo()
    if (info) {
      setStore("addBalanceAmount", info.reloadAmount.toString())
    }
  })

  const balance = createMemo(() => formatBalance(billingInfo()?.balance ?? 0))

  async function onClickCheckout(provider: "alipay" | "wechat") {
    const amount = parseInt(store.addBalanceAmount)
    const baseUrl = window.location.href
    const checkout = await checkoutAction(params.id!, amount, baseUrl, baseUrl, provider)

    if (checkout?.data) {
      setStore("checkoutRedirecting", true)
      window.location.href = checkout.data
    }
  }

  function showAddBalanceForm() {
    while (true) {
      checkoutSubmission.clear()
      if (!checkoutSubmission.result) break
    }
    setStore("showAddBalanceForm", true)
  }

  function hideAddBalanceForm() {
    setStore("showAddBalanceForm", false)
    checkoutSubmission.clear()
  }

  return (
    <section class={styles.root}>
      <div data-slot="section-title">
        <h2>{i18n.t("workspace.billing.title")}</h2>
        <p>
          {i18n.t("workspace.billing.subtitle.beforeLink")}{" "}
          <a href="mailto:contact@anoma.ly">{i18n.t("workspace.billing.contactUs")}</a>{" "}
          {i18n.t("workspace.billing.subtitle.afterLink")}
        </p>
      </div>
      <div data-slot="section-content">
        <div data-slot="balance-display">
          <div data-slot="balance-amount">
            <span data-slot="balance-value">${balance()}</span>
            <span data-slot="balance-label">{i18n.t("workspace.billing.currentBalance")}</span>
          </div>
          <div data-slot="balance-right-section">
            <Show
              when={!store.showAddBalanceForm}
              fallback={
                <div data-slot="add-balance-form-container">
                  <div data-slot="add-balance-form">
                    <label>{i18n.t("workspace.billing.add")}</label>
                    <input
                      data-component="input"
                      type="number"
                      min={billingInfo()?.reloadAmountMin.toString()}
                      step="1"
                      value={store.addBalanceAmount}
                      onInput={(event) => {
                        setStore("addBalanceAmount", event.currentTarget.value)
                        checkoutSubmission.clear()
                      }}
                      placeholder={i18n.t("workspace.billing.enterAmount")}
                    />
                    <div data-slot="form-actions">
                      <button data-color="ghost" type="button" onClick={hideAddBalanceForm}>
                        {i18n.t("common.cancel")}
                      </button>
                      <button
                        data-color="primary"
                        type="button"
                        disabled={!store.addBalanceAmount || checkoutSubmission.pending || store.checkoutRedirecting}
                        onClick={() => onClickCheckout("alipay")}
                      >
                        {checkoutSubmission.pending || store.checkoutRedirecting
                          ? i18n.t("workspace.billing.loading")
                          : "Alipay"}
                      </button>
                      <button
                        data-color="secondary"
                        type="button"
                        disabled={!store.addBalanceAmount || checkoutSubmission.pending || store.checkoutRedirecting}
                        onClick={() => onClickCheckout("wechat")}
                      >
                        {checkoutSubmission.pending || store.checkoutRedirecting
                          ? i18n.t("workspace.billing.loading")
                          : "WeChat Pay"}
                      </button>
                    </div>
                  </div>
                  <Show when={checkoutSubmission.result && (checkoutSubmission.result as any).error}>
                    {(error: any) => <div data-slot="form-error">{localizeError(i18n.t, error())}</div>}
                  </Show>
                </div>
              }
            >
              <button data-color="primary" onClick={showAddBalanceForm}>
                {i18n.t("workspace.billing.addBalance")}
              </button>
            </Show>

            <Show when={billingInfo()?.paymentMethodType}>
              <div data-slot="credit-card">
                <div data-slot="card-icon">
                  <Switch fallback={<IconCreditCard style={{ width: "24px", height: "24px" }} />}>
                    <Match when={billingInfo()?.paymentMethodType === "link"}>
                      <IconStripe style={{ width: "24px", height: "24px" }} />
                    </Match>
                    <Match when={billingInfo()?.paymentMethodType === "alipay"}>
                      <IconAlipay style={{ width: "24px", height: "24px" }} />
                    </Match>
                    <Match when={billingInfo()?.paymentMethodType === "wechat_pay"}>
                      <IconWechat style={{ width: "24px", height: "24px" }} />
                    </Match>
                    <Match when={billingInfo()?.paymentMethodType === "upi"}>
                      <IconUpi style={{ width: "auto", height: "16px" }} />
                    </Match>
                  </Switch>
                </div>
                <div data-slot="card-details">
                  <Switch>
                    <Match when={billingInfo()?.paymentMethodType === "alipay"}>
                      <span data-slot="type">{i18n.t("workspace.billing.alipay")}</span>
                    </Match>
                    <Match when={billingInfo()?.paymentMethodType === "wechat_pay"}>
                      <span data-slot="type">{i18n.t("workspace.billing.wechat")}</span>
                    </Match>
                    <Match when={billingInfo()?.paymentMethodType === "link"}>
                      <span data-slot="type">{i18n.t("workspace.billing.linkedToStripe")}</span>
                    </Match>
                  </Switch>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </section>
  )
}
