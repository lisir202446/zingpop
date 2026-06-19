export type AdminRouteResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

export function adminErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "Admin request failed")
  if (message === "Global admin access required") return "Sign in with a Zingpop global admin account to use this backend."
  return message
}

export function adminErrorTitle(message: string | undefined, fallback: string) {
  if (message === "Sign in with a Zingpop global admin account to use this backend.") return "Admin access required"
  return fallback
}
