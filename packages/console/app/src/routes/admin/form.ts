export function requireAdminField(form: FormData, name: string) {
  const value = (form.get(name) as string | null)?.trim()
  if (value) return value
  throw new Error(`Missing ${name}`)
}

export function parseAdminAmount(value: string | null) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) throw new Error("Amount must be a number")
  if (amount === 0) throw new Error("Amount cannot be zero")
  return amount
}

export function parseAdminLimit(value: string | null) {
  if (!value?.trim()) return null
  const limit = Number(value)
  if (!Number.isFinite(limit)) throw new Error("Monthly limit must be a number")
  if (!Number.isInteger(limit)) throw new Error("Monthly limit must be a whole number")
  if (limit < 0) throw new Error("Monthly limit cannot be negative")
  return limit
}
