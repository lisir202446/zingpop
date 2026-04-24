import { strip } from "./language"

function normalize(pathname: string) {
  const next = strip(pathname).replace(/\/+$/, "")
  return next || "/"
}

export function isAuthIndexPath(pathname: string) {
  return normalize(pathname) === "/auth"
}

export function authIndexRedirectLocation(request: Request) {
  const search = new URL(request.url).search
  return search ? `/auth/phone${search}` : "/auth/phone"
}
