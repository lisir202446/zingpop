export namespace Phone {
  export function normalize(input: string) {
    const compact = input.trim().replace(/[\s-]/g, "")
    const withoutCountryCode = compact.startsWith("+86")
      ? compact.slice(3)
      : compact.startsWith("86") && compact.length === 13
        ? compact.slice(2)
        : compact

    if (!/^1[3-9]\d{9}$/.test(withoutCountryCode)) {
      throw new Error("Invalid phone number")
    }

    return withoutCountryCode
  }

  export function mask(input: string) {
    const phone = normalize(input)
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }

  export function toE164(input: string) {
    return `+86${normalize(input)}`
  }
}
