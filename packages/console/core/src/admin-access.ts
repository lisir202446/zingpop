import { Actor } from "./actor"

export namespace AdminAccess {
  export const ERROR_MESSAGE = "Global admin access required"

  function list(value?: string) {
    return (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  export function allowed(env: Record<string, string | undefined> = process.env) {
    const actor = Actor.use()
    if (actor.type !== "account") return false

    return (
      list(env.ZINGPOP_ADMIN_ACCOUNT_IDS).includes(actor.properties.accountID) ||
      list(env.ZINGPOP_ADMIN_PHONES).includes(actor.properties.phone ?? "") ||
      list(env.ZINGPOP_ADMIN_LOGINS).includes(actor.properties.login)
    )
  }

  export function assert(env: Record<string, string | undefined> = process.env) {
    if (allowed(env)) return Actor.assert("account")
    throw new Error(ERROR_MESSAGE)
  }
}
