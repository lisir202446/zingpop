import { action, redirect, useSearchParams, useSubmission } from "@solidjs/router"
import { Actor } from "@opencode-ai/console-core/actor.js"
import { Database, and, eq, isNull } from "@opencode-ai/console-core/drizzle/index.js"
import { Phone } from "@opencode-ai/console-core/phone.js"
import { PhoneAuth } from "@opencode-ai/console-core/phone-auth.js"
import { PhonePasswordAuth } from "@opencode-ai/console-core/password-auth.js"
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

async function startPhoneSession(input: { accountID: string; phone: string; request: Request; next: string }) {
  const session = await useAuthSession()
  const workspaceID = await ensureWorkspace(input.accountID, input.phone, input.request)

  await session.update((value) => ({
    ...value,
    account: {
      ...value.account,
      [input.accountID]: {
        id: input.accountID,
        login: input.phone,
        phone: input.phone,
      },
    },
    current: input.accountID,
  }))

  return redirect(route(localeFromRequest(input.request), input.next || `/workspace/${workspaceID}/home`))
}

function readPhone(form: FormData) {
  return (form.get("phone") as string | null)?.trim()
}

function readPassword(form: FormData) {
  return (form.get("password") as string | null) ?? ""
}

function readConfirmPassword(form: FormData) {
  return (form.get("confirmPassword") as string | null) ?? ""
}

async function sendCode(form: FormData) {
  "use server"
  const phone = readPhone(form)
  if (!phone) return { error: formError.phoneRequired }

  return PhoneAuth.sendCode({ phone, ip: readIP() })
    .then((data) => ({ error: undefined, data }))
    .catch((error: Error) => ({ error: authActionError(error) }))
}

function authActionError(error: Error) {
  if (error.message.includes("Database configuration")) return "Authentication service is not ready"
  if (error.message.includes("Cannot read properties of undefined")) return "Authentication service is not ready"
  return error.message
}

const sendRegisterCode = action(sendCode, "auth.phone.register.send")
const sendResetCode = action(sendCode, "auth.phone.reset.send")

const loginWithPassword = action(async (form: FormData) => {
  "use server"
  const request = getRequestEvent()?.request
  if (!request) throw new Error("No request event")

  const phone = readPhone(form)
  if (!phone) return { error: formError.phoneRequired }

  const password = readPassword(form)
  if (!password) return { error: formError.passwordRequired }

  const next = (form.get("continue") as string | null) ?? ""

  return PhonePasswordAuth.login({ phone, password })
    .then((data) => startPhoneSession({ ...data, request, next }))
    .catch((error: Error) => ({ error: authActionError(error) }))
}, "auth.phone.password.login")

const registerWithPassword = action(async (form: FormData) => {
  "use server"
  const request = getRequestEvent()?.request
  if (!request) throw new Error("No request event")

  const phone = readPhone(form)
  if (!phone) return { error: formError.phoneRequired }

  const code = (form.get("code") as string | null)?.trim()
  if (!code) return { error: formError.codeRequired }

  const password = readPassword(form)
  const confirmPassword = readConfirmPassword(form)
  if (!password) return { error: formError.passwordRequired }
  if (password !== confirmPassword) return { error: formError.passwordMismatch }

  const next = (form.get("continue") as string | null) ?? ""

  return PhonePasswordAuth.register({ phone, code, password })
    .then((data) => startPhoneSession({ ...data, request, next }))
    .catch((error: Error) => ({ error: authActionError(error) }))
}, "auth.phone.password.register")

const resetPassword = action(async (form: FormData) => {
  "use server"
  const request = getRequestEvent()?.request
  if (!request) throw new Error("No request event")

  const phone = readPhone(form)
  if (!phone) return { error: formError.phoneRequired }

  const code = (form.get("code") as string | null)?.trim()
  if (!code) return { error: formError.codeRequired }

  const password = readPassword(form)
  const confirmPassword = readConfirmPassword(form)
  if (!password) return { error: formError.passwordRequired }
  if (password !== confirmPassword) return { error: formError.passwordMismatch }

  const next = (form.get("continue") as string | null) ?? ""

  return PhonePasswordAuth.reset({ phone, code, password })
    .then((data) => startPhoneSession({ ...data, request, next }))
    .catch((error: Error) => ({ error: authActionError(error) }))
}, "auth.phone.password.reset")

function FormError(props: { error?: string }) {
  const i18n = useI18n()
  return <Show when={props.error}>{(error) => <div data-slot="form-error">{localizeError(i18n.t, error())}</div>}</Show>
}

function CodeStatus(props: { result?: { error?: string; data?: { phone: string; devCode?: string } } }) {
  const i18n = useI18n()
  return (
    <>
      <FormError error={props.result?.error} />
      <Show when={props.result?.data?.phone}>
        {(phone) => <div data-slot="form-success">{i18n.t("auth.phone.codeSent", { phone: Phone.mask(phone()) })}</div>}
      </Show>
      <Show when={props.result?.data?.devCode}>
        {(code) => <div data-slot="form-success">{i18n.t("auth.phone.devCode", { code: code() })}</div>}
      </Show>
    </>
  )
}

export default function PhoneAuthPage() {
  const i18n = useI18n()
  const [search] = useSearchParams()
  const loginSubmission = useSubmission(loginWithPassword)
  const sendRegisterSubmission = useSubmission(sendRegisterCode)
  const registerSubmission = useSubmission(registerWithPassword)
  const sendResetSubmission = useSubmission(sendResetCode)
  const resetSubmission = useSubmission(resetPassword)
  const [store, setStore] = createStore({
    mode: "login" as "login" | "register" | "reset",
    registerPhone: "",
    resetPhone: "",
  })

  createEffect(() => {
    const phone =
      sendRegisterSubmission.result && "data" in sendRegisterSubmission.result
        ? sendRegisterSubmission.result.data.phone
        : undefined
    if (phone) setStore("registerPhone", phone)
  })

  createEffect(() => {
    const phone =
      sendResetSubmission.result && "data" in sendResetSubmission.result ? sendResetSubmission.result.data.phone : undefined
    if (phone) setStore("resetPhone", phone)
  })

  const next = () => (typeof search.continue === "string" ? search.continue : "")

  return (
    <main data-page="auth-phone">
      <section style={{ width: "min(100%, 440px)", margin: "80px auto", padding: "0 16px" }}>
        <div style={{ display: "grid", gap: "8px", "margin-bottom": "20px" }}>
          <h1 style={{ margin: 0 }}>{i18n.t("auth.phone.title")}</h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>{i18n.t("auth.phone.subtitle")}</p>
        </div>

        <div data-slot="auth-tabs" style={{ display: "flex", gap: "8px", "margin-bottom": "24px" }}>
          <button type="button" data-auth-tab="login" data-color={store.mode === "login" ? "primary" : "ghost"} onClick={() => setStore("mode", "login")}>
            {i18n.t("auth.phone.loginTitle")}
          </button>
          <button type="button" data-auth-tab="register" data-color={store.mode === "register" ? "primary" : "ghost"} onClick={() => setStore("mode", "register")}>
            {i18n.t("auth.phone.registerTitle")}
          </button>
          <button type="button" data-auth-tab="reset" data-color={store.mode === "reset" ? "primary" : "ghost"} onClick={() => setStore("mode", "reset")}>
            {i18n.t("auth.phone.resetTitle")}
          </button>
        </div>

        <Show when={store.mode === "login"}>
          <div data-auth-panel="login">
            <div style={{ display: "grid", gap: "6px", "margin-bottom": "18px" }}>
              <h2 style={{ margin: 0 }}>{i18n.t("auth.phone.loginTitle")}</h2>
              <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>{i18n.t("auth.phone.loginSubtitle")}</p>
            </div>
            <form action={loginWithPassword} method="post" style={{ display: "grid", gap: "12px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span>{i18n.t("auth.phone.phoneLabel")}</span>
                <input data-component="input" name="phone" type="tel" inputMode="numeric" autocomplete="tel" placeholder={i18n.t("auth.phone.phonePlaceholder")} />
              </label>
              <label style={{ display: "grid", gap: "8px" }}>
                <span>{i18n.t("auth.phone.passwordLabel")}</span>
                <input data-component="input" name="password" type="password" autocomplete="current-password" placeholder={i18n.t("auth.phone.passwordPlaceholder")} />
              </label>
              <input type="hidden" name="continue" value={next()} />
              <FormError error={loginSubmission.result?.error} />
              <button type="submit" data-color="primary" data-auth-action="login" disabled={loginSubmission.pending}>
                {loginSubmission.pending ? i18n.t("auth.phone.loggingIn") : i18n.t("auth.phone.login")}
              </button>
            </form>
          </div>
        </Show>

        <Show when={store.mode === "register"}>
          <div data-auth-panel="register">
            <div style={{ display: "grid", gap: "6px", "margin-bottom": "18px" }}>
              <h2 style={{ margin: 0 }}>{i18n.t("auth.phone.registerTitle")}</h2>
              <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>{i18n.t("auth.phone.registerSubtitle")}</p>
            </div>
            <form action={sendRegisterCode} method="post" style={{ display: "grid", gap: "12px", "margin-bottom": "18px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span>{i18n.t("auth.phone.phoneLabel")}</span>
                <input
                  data-component="input"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autocomplete="tel"
                  placeholder={i18n.t("auth.phone.phonePlaceholder")}
                  value={store.registerPhone}
                  onInput={(event) => setStore("registerPhone", event.currentTarget.value)}
                />
              </label>
              <CodeStatus result={sendRegisterSubmission.result} />
              <button type="submit" data-color="primary" data-auth-action="send-register-code" disabled={sendRegisterSubmission.pending}>
                {sendRegisterSubmission.pending ? i18n.t("auth.phone.sendingCode") : i18n.t("auth.phone.sendCode")}
              </button>
            </form>
            <form action={registerWithPassword} method="post" style={{ display: "grid", gap: "12px" }}>
              <input type="hidden" name="phone" value={store.registerPhone} />
              <label style={{ display: "grid", gap: "8px" }}>
                <span>{i18n.t("auth.phone.codeLabel")}</span>
                <input data-component="input" name="code" type="text" inputMode="numeric" autocomplete="one-time-code" placeholder={i18n.t("auth.phone.codePlaceholder")} />
              </label>
              <label style={{ display: "grid", gap: "8px" }}>
                <span>{i18n.t("auth.phone.passwordLabel")}</span>
                <input data-component="input" name="password" type="password" autocomplete="new-password" placeholder={i18n.t("auth.phone.passwordPlaceholder")} />
              </label>
              <label style={{ display: "grid", gap: "8px" }}>
                <span>{i18n.t("auth.phone.confirmPasswordLabel")}</span>
                <input data-component="input" name="confirmPassword" type="password" autocomplete="new-password" placeholder={i18n.t("auth.phone.confirmPasswordPlaceholder")} />
              </label>
              <input type="hidden" name="continue" value={next()} />
              <FormError error={registerSubmission.result?.error} />
              <button type="submit" data-color="primary" data-auth-action="register" disabled={registerSubmission.pending}>
                {registerSubmission.pending ? i18n.t("auth.phone.creatingAccount") : i18n.t("auth.phone.createAccount")}
              </button>
            </form>
          </div>
        </Show>

        <Show when={store.mode === "reset"}>
          <div data-auth-panel="reset">
            <div style={{ display: "grid", gap: "6px", "margin-bottom": "18px" }}>
              <h2 style={{ margin: 0 }}>{i18n.t("auth.phone.resetTitle")}</h2>
              <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>{i18n.t("auth.phone.resetSubtitle")}</p>
            </div>
            <form action={sendResetCode} method="post" style={{ display: "grid", gap: "12px", "margin-bottom": "18px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span>{i18n.t("auth.phone.phoneLabel")}</span>
                <input
                  data-component="input"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autocomplete="tel"
                  placeholder={i18n.t("auth.phone.phonePlaceholder")}
                  value={store.resetPhone}
                  onInput={(event) => setStore("resetPhone", event.currentTarget.value)}
                />
              </label>
              <CodeStatus result={sendResetSubmission.result} />
              <button type="submit" data-color="primary" data-auth-action="send-reset-code" disabled={sendResetSubmission.pending}>
                {sendResetSubmission.pending ? i18n.t("auth.phone.sendingCode") : i18n.t("auth.phone.sendCode")}
              </button>
            </form>
            <form action={resetPassword} method="post" style={{ display: "grid", gap: "12px" }}>
              <input type="hidden" name="phone" value={store.resetPhone} />
              <label style={{ display: "grid", gap: "8px" }}>
                <span>{i18n.t("auth.phone.codeLabel")}</span>
                <input data-component="input" name="code" type="text" inputMode="numeric" autocomplete="one-time-code" placeholder={i18n.t("auth.phone.codePlaceholder")} />
              </label>
              <label style={{ display: "grid", gap: "8px" }}>
                <span>{i18n.t("auth.phone.passwordLabel")}</span>
                <input data-component="input" name="password" type="password" autocomplete="new-password" placeholder={i18n.t("auth.phone.passwordPlaceholder")} />
              </label>
              <label style={{ display: "grid", gap: "8px" }}>
                <span>{i18n.t("auth.phone.confirmPasswordLabel")}</span>
                <input data-component="input" name="confirmPassword" type="password" autocomplete="new-password" placeholder={i18n.t("auth.phone.confirmPasswordPlaceholder")} />
              </label>
              <input type="hidden" name="continue" value={next()} />
              <FormError error={resetSubmission.result?.error} />
              <button type="submit" data-color="primary" data-auth-action="reset" disabled={resetSubmission.pending}>
                {resetSubmission.pending ? i18n.t("auth.phone.resettingPassword") : i18n.t("auth.phone.resetPassword")}
              </button>
            </form>
          </div>
        </Show>
      </section>
    </main>
  )
}
