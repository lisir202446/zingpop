import type { Key } from "~/i18n"

export const formError = {
  invalidPlan: "error.invalidPlan",
  workspaceRequired: "error.workspaceRequired",
  alreadySubscribed: "error.alreadySubscribed",
  limitRequired: "error.limitRequired",
  monthlyLimitInvalid: "error.monthlyLimitInvalid",
  workspaceNameRequired: "error.workspaceNameRequired",
  nameTooLong: "error.nameTooLong",
  emailRequired: "error.emailRequired",
  phoneRequired: "error.phoneRequired",
  phoneInvalid: "error.phoneInvalid",
  codeRequired: "error.codeRequired",
  codeInvalid: "error.codeInvalid",
  codeExpired: "error.codeExpired",
  codeRateLimited: "error.codeRateLimited",
  codeDailyLimit: "error.codeDailyLimit",
  codeAttemptsExceeded: "error.codeAttemptsExceeded",
  smsNotConfigured: "error.smsNotConfigured",
  smsSendFailed: "error.smsSendFailed",
  roleRequired: "error.roleRequired",
  idRequired: "error.idRequired",
  nameRequired: "error.nameRequired",
  providerRequired: "error.providerRequired",
  apiKeyRequired: "error.apiKeyRequired",
  modelRequired: "error.modelRequired",
} as const

const map = {
  [formError.invalidPlan]: "error.invalidPlan",
  [formError.workspaceRequired]: "error.workspaceRequired",
  [formError.alreadySubscribed]: "error.alreadySubscribed",
  [formError.limitRequired]: "error.limitRequired",
  [formError.monthlyLimitInvalid]: "error.monthlyLimitInvalid",
  [formError.workspaceNameRequired]: "error.workspaceNameRequired",
  [formError.nameTooLong]: "error.nameTooLong",
  [formError.emailRequired]: "error.emailRequired",
  [formError.phoneRequired]: "error.phoneRequired",
  [formError.phoneInvalid]: "error.phoneInvalid",
  [formError.codeRequired]: "error.codeRequired",
  [formError.codeInvalid]: "error.codeInvalid",
  [formError.codeExpired]: "error.codeExpired",
  [formError.codeRateLimited]: "error.codeRateLimited",
  [formError.codeDailyLimit]: "error.codeDailyLimit",
  [formError.codeAttemptsExceeded]: "error.codeAttemptsExceeded",
  [formError.smsNotConfigured]: "error.smsNotConfigured",
  [formError.smsSendFailed]: "error.smsSendFailed",
  [formError.roleRequired]: "error.roleRequired",
  [formError.idRequired]: "error.idRequired",
  [formError.nameRequired]: "error.nameRequired",
  [formError.providerRequired]: "error.providerRequired",
  [formError.apiKeyRequired]: "error.apiKeyRequired",
  [formError.modelRequired]: "error.modelRequired",
  "Invalid plan": "error.invalidPlan",
  "Workspace ID is required": "error.workspaceRequired",
  "Workspace ID is required.": "error.workspaceRequired",
  "This workspace already has a subscription": "error.alreadySubscribed",
  "Limit is required.": "error.limitRequired",
  "Set a valid monthly limit": "error.monthlyLimitInvalid",
  "Set a valid monthly limit.": "error.monthlyLimitInvalid",
  "Workspace name is required.": "error.workspaceNameRequired",
  "Name must be 255 characters or less.": "error.nameTooLong",
  "Email is required": "error.emailRequired",
  "Phone number is required": "error.phoneRequired",
  "Invalid phone number": "error.phoneInvalid",
  "Verification code is required": "error.codeRequired",
  "Invalid verification code": "error.codeInvalid",
  "Verification code has expired": "error.codeExpired",
  "Please wait before requesting another verification code": "error.codeRateLimited",
  "Daily verification code limit reached": "error.codeDailyLimit",
  "Too many invalid verification attempts": "error.codeAttemptsExceeded",
  "SMS service is not configured": "error.smsNotConfigured",
  "Failed to send verification code": "error.smsSendFailed",
  "Role is required": "error.roleRequired",
  "ID is required": "error.idRequired",
  "Name is required": "error.nameRequired",
  "Provider is required": "error.providerRequired",
  "API key is required": "error.apiKeyRequired",
  "Model is required": "error.modelRequired",
  "workspace.reload.error.paymentFailed": "workspace.reload.error.paymentFailed",
  "Payment failed": "workspace.reload.error.paymentFailed",
  "Payment failed.": "workspace.reload.error.paymentFailed",
} as const satisfies Record<string, Key>

export function formErrorReloadAmountMin(amount: number) {
  return `error.reloadAmountMin:${amount}`
}

export function formErrorReloadTriggerMin(amount: number) {
  return `error.reloadTriggerMin:${amount}`
}

export function localizeError(t: (key: Key, params?: Record<string, string | number>) => string, error?: string) {
  if (!error) return ""

  if (error.startsWith("error.reloadAmountMin:")) {
    const amount = Number(error.split(":")[1] ?? 0)
    return t("error.reloadAmountMin", { amount })
  }

  if (error.startsWith("error.reloadTriggerMin:")) {
    const amount = Number(error.split(":")[1] ?? 0)
    return t("error.reloadTriggerMin", { amount })
  }

  const amount = error.match(/^Reload amount must be at least \$(\d+)$/)
  if (amount) return t("error.reloadAmountMin", { amount: Number(amount[1]) })

  const trigger = error.match(/^Balance trigger must be at least \$(\d+)$/)
  if (trigger) return t("error.reloadTriggerMin", { amount: Number(trigger[1]) })

  const key = map[error as keyof typeof map]
  if (key) return t(key)
  return error
}
