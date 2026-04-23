import { action, redirect, useSearchParams, useSubmission } from "@solidjs/router"
import { Actor } from "@opencode-ai/console-core/actor.js"
import { Database, and, eq, isNull } from "@opencode-ai/console-core/drizzle/index.js"
import { Phone } from "@opencode-ai/console-core/phone.js"
import { PhoneAuth } from "@opencode-ai/console-core/phone-auth.js"
import { UserTable } from "@opencode-ai/console-core/schema/user.sql.js"
import { Workspace } from "@opencode-ai/console-core/workspace.js"
import { createEffect, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { getRequestEvent } from "solid-js/web"
import { useAuthSession } from "~/context/auth"
import { useI18n } from "~/context/i18n"
import { i18n } from "~/i18n"
import { localizeError, formError } from "~/lib/form-error"
import { localeFromRequest, route } from "~/lib/language"

function readIP() {
  const request = getRequestEvent()?.request
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded ?? request?.headers.get("x-real-ip") ?? undefined
}

async function ensureWorkspace(accountID: string, phone: string, request: Request) {
  const existing = await Database.use((tx) =>
    tx
      .select({
        workspaceID: UserTable.workspaceID,
      })
      .from(UserTable)
      .where(and(eq(UserTable.accountID, accountID), isNull(UserTable.timeDeleted)))
      .limit(1)
      .then((rows) => rows[0]?.workspaceID),
  )

  if (existing) return existing

  const locale = localeFromRequest(request)
  const dict = i18n(locale)
  return Actor.provide(
    "account",
    {
      accountID,
      login: phone,
      phone,
    },
    () => Workspace.create({ name: dict["workspace.settings.defaultName"] }),
  )
}

const sendCode = action(async (form: FormData) => {
  "use server"
  const phone = (form.get("phone") as string | null)?.trim()
  if (!phone) return { error: formError.phoneRequired }

  return PhoneAuth.sendCode({ phone, ip: readIP() })
    .then((data) => ({ error: undefined, data }))
    .catch((error: Error) => ({ error: error.message }))
}, "auth.phone.send")

const verifyCode = action(async (form: FormData) => {
  "use server"
  const request = getRequestEvent()?.request
  if (!request) throw new Error("No request event")

  const phone = (form.get("phone") as string | null)?.trim()
  if (!phone) return { error: formError.phoneRequired }

  const code = (form.get("code") as string | null)?.trim()
  if (!code) return { error: formError.codeRequired }

  const next = (form.get("continue") as string | null) ?? ""

  return PhoneAuth.verifyCode({ phone, code })
    .then(async (data) => {
      const session = await useAuthSession()
      const workspaceID = await ensureWorkspace(data.accountID, data.phone, request)

      await session.update((value) => ({
        ...value,
        account: {
          ...value.account,
          [data.accountID]: {
            id: data.accountID,
            login: data.phone,
            phone: data.phone,
          },
        },
        current: data.accountID,
      }))

      const locale = localeFromRequest(request)
      return redirect(route(locale, next || `/workspace/${workspaceID}`))
    })
    .catch((error: Error) => ({ error: error.message }))
}, "auth.phone.verify")

export default function PhoneAuthPage() {
  const i18n = useI18n()
  const [search] = useSearchParams()
  const sendSubmission = useSubmission(sendCode)
  const verifySubmission = useSubmission(verifyCode)
  const [store, setStore] = createStore({
    phone: "",
  })

  createEffect(() => {
    const phone = sendSubmission.result && "data" in sendSubmission.result ? sendSubmission.result.data.phone : undefined
    if (phone) setStore("phone", phone)
  })

  return (
    <main data-page="auth-phone">
      <section style={{ width: "min(100%, 420px)", margin: "80px auto", padding: "0 16px" }}>
        <div style={{ display: "grid", gap: "12px", "margin-bottom": "24px" }}>
          <h1 style={{ margin: 0 }}>{i18n.t("auth.phone.title")}</h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>{i18n.t("auth.phone.subtitle")}</p>
        </div>

        <form action={sendCode} method="post" style={{ display: "grid", gap: "12px", "margin-bottom": "20px" }}>
          <label style={{ display: "grid", gap: "8px" }}>
            <span>{i18n.t("auth.phone.phoneLabel")}</span>
            <input
              data-component="input"
              name="phone"
              type="tel"
              inputMode="numeric"
              autocomplete="tel"
              placeholder={i18n.t("auth.phone.phonePlaceholder")}
              value={store.phone}
              onInput={(event) => setStore("phone", event.currentTarget.value)}
            />
          </label>
          <Show when={sendSubmission.result?.error}>
            {(error) => <div data-slot="form-error">{localizeError(i18n.t, error())}</div>}
          </Show>
          <Show when={sendSubmission.result && "data" in sendSubmission.result ? sendSubmission.result.data.phone : undefined}>
            {(phone) => (
              <div data-slot="form-success">
                {i18n.t("auth.phone.codeSent", { phone: Phone.mask(phone()) })}
              </div>
            )}
          </Show>
          <button type="submit" data-color="primary" disabled={sendSubmission.pending}>
            {sendSubmission.pending ? i18n.t("auth.phone.sendingCode") : i18n.t("auth.phone.sendCode")}
          </button>
        </form>

        <form action={verifyCode} method="post" style={{ display: "grid", gap: "12px" }}>
          <label style={{ display: "grid", gap: "8px" }}>
            <span>{i18n.t("auth.phone.phoneLabel")}</span>
            <input
              data-component="input"
              name="phone"
              type="tel"
              inputMode="numeric"
              autocomplete="tel"
              placeholder={i18n.t("auth.phone.phonePlaceholder")}
              value={store.phone}
              onInput={(event) => setStore("phone", event.currentTarget.value)}
            />
          </label>
          <label style={{ display: "grid", gap: "8px" }}>
            <span>{i18n.t("auth.phone.codeLabel")}</span>
            <input
              data-component="input"
              name="code"
              type="text"
              inputMode="numeric"
              autocomplete="one-time-code"
              placeholder={i18n.t("auth.phone.codePlaceholder")}
            />
          </label>
          <input type="hidden" name="continue" value={typeof search.continue === "string" ? search.continue : ""} />
          <Show when={verifySubmission.result?.error}>
            {(error) => <div data-slot="form-error">{localizeError(i18n.t, error())}</div>}
          </Show>
          <button type="submit" data-color="primary" disabled={verifySubmission.pending}>
            {verifySubmission.pending ? i18n.t("auth.phone.verifyingCode") : i18n.t("auth.phone.verifyCode")}
          </button>
        </form>
      </section>
    </main>
  )
}
