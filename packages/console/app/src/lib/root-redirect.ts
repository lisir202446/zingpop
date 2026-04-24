export function rootRedirectLocation(request: Request) {
  const search = new URL(request.url).search
  return search ? `/auth/phone${search}` : "/auth/phone"
}
