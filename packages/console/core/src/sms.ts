import { createHash, createHmac, randomUUID } from "node:crypto"
import { Phone } from "./phone"

function legacyConfigured(env: Record<string, string | undefined>) {
  return Boolean(
    env.HUAWEI_SMS_ENDPOINT &&
      env.HUAWEI_SMS_APP_KEY &&
      env.HUAWEI_SMS_APP_SECRET &&
      env.HUAWEI_SMS_SENDER &&
      env.HUAWEI_SMS_TEMPLATE_ID,
  )
}

function apigConfigured(env: Record<string, string | undefined>) {
  return Boolean(
    (env.SMS_PROVIDER === "huawei_apig" || env.HUAWEI_APIG_SMS_URL) &&
      env.HUAWEI_APIG_SMS_URL &&
      (env.HUAWEI_APIG_APPCODE || (env.HUAWEI_APIG_APP_KEY && env.HUAWEI_APIG_APP_SECRET)) &&
      env.HUAWEI_APIG_SMS_CONTENT_TEMPLATE,
  )
}

function configured(env: Record<string, string | undefined>) {
  return legacyConfigured(env) || apigConfigured(env)
}

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error("SMS service is not configured")
  return value
}

function legacyConfig() {
  return {
    kind: "legacy" as const,
    endpoint: env("HUAWEI_SMS_ENDPOINT"),
    appKey: env("HUAWEI_SMS_APP_KEY"),
    appSecret: env("HUAWEI_SMS_APP_SECRET"),
    sender: env("HUAWEI_SMS_SENDER"),
    templateId: env("HUAWEI_SMS_TEMPLATE_ID"),
    signature: process.env.HUAWEI_SMS_SIGNATURE,
    statusCallback: process.env.HUAWEI_SMS_STATUS_CALLBACK,
  }
}

function apigConfig() {
  return {
    kind: "huawei_apig" as const,
    url: env("HUAWEI_APIG_SMS_URL"),
    appCode: process.env.HUAWEI_APIG_APPCODE,
    appKey: process.env.HUAWEI_APIG_APP_KEY,
    appSecret: process.env.HUAWEI_APIG_APP_SECRET,
    contentTemplate: env("HUAWEI_APIG_SMS_CONTENT_TEMPLATE"),
    contentParam: process.env.HUAWEI_APIG_SMS_CONTENT_PARAM || "content",
    mobileParam: process.env.HUAWEI_APIG_SMS_MOBILE_PARAM || "mobile",
    stage: process.env.HUAWEI_APIG_STAGE || "RELEASE",
    userAgent: process.env.HUAWEI_APIG_USER_AGENT || "ZingpopSmsClient/1.0",
  }
}

function config() {
  if (process.env.SMS_PROVIDER === "huawei_apig" || process.env.HUAWEI_APIG_SMS_URL) return apigConfig()
  return legacyConfig()
}

function wsse(appKey: string, appSecret: string) {
  const nonce = randomUUID().replace(/-/g, "")
  const created = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
  const passwordDigest = createHash("sha256").update(nonce + created + appSecret).digest("base64")
  return `UsernameToken Username="${appKey}",PasswordDigest="${passwordDigest}",Nonce="${nonce}",Created="${created}"`
}

function huaweiTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

function percentEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

function canonicalQuery(params: URLSearchParams) {
  return [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
    .join("&")
}

function huaweiApigAuthorization(input: {
  method: string
  url: URL
  appKey: string
  appSecret: string
  xSdkDate: string
  userAgent: string
  stage: string
}) {
  const signedHeaders = "user-agent;x-sdk-date;x-stage"
  const canonicalHeaders = [
    `user-agent:${input.userAgent.trim()}`,
    `x-sdk-date:${input.xSdkDate.trim()}`,
    `x-stage:${input.stage.trim()}`,
  ].join("\n") + "\n"
  const canonicalRequest = [
    input.method.toUpperCase(),
    input.url.pathname || "/",
    input.url.search.replace(/^\?/, ""),
    canonicalHeaders,
    signedHeaders,
    createHash("sha256").update("").digest("hex"),
  ].join("\n")
  const stringToSign = [
    "SDK-HMAC-SHA256",
    input.xSdkDate,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n")

  return `SDK-HMAC-SHA256 Access=${input.appKey}, SignedHeaders=${signedHeaders}, Signature=${createHmac("sha256", input.appSecret).update(stringToSign).digest("hex")}`
}

async function sendLegacyLoginCode(input: { phone: string; code: string }, current: ReturnType<typeof legacyConfig>) {
  const body = new URLSearchParams({
    from: current.sender,
    to: Phone.toE164(input.phone),
    templateId: current.templateId,
    templateParas: JSON.stringify([input.code]),
    ...(current.signature ? { signature: current.signature } : {}),
    ...(current.statusCallback ? { statusCallback: current.statusCallback } : {}),
  })

  const response = await fetch(new URL("/sms/batchSendSms/v1", current.endpoint), {
    method: "POST",
    headers: {
      Authorization: 'WSSE realm="SDP",profile="UsernameToken",type="Appkey"',
      "Content-Type": "application/x-www-form-urlencoded",
      "X-WSSE": wsse(current.appKey, current.appSecret),
    },
    body: body.toString(),
  })

  const result = (await response.json()) as {
    code?: string
    description?: string
    error_msg?: string
  }

  if (!response.ok) {
    throw new Error(result.description ?? result.error_msg ?? "Failed to send verification code")
  }

  if (result.code && result.code !== "000000") {
    throw new Error(result.description ?? "Failed to send verification code")
  }
}

async function sendApigLoginCode(input: { phone: string; code: string }, current: ReturnType<typeof apigConfig>) {
  const url = new URL(current.url)
  url.search = canonicalQuery(
    new URLSearchParams({
      [current.contentParam]: current.contentTemplate.replace("{code}", input.code),
      [current.mobileParam]: Phone.normalize(input.phone),
    }),
  )
  const xSdkDate = huaweiTimestamp()
  const headers = new Headers({
    "Content-Length": "0",
    "User-Agent": current.userAgent,
  })
  if (current.appCode) {
    headers.set("X-Apig-AppCode", current.appCode)
  } else {
    headers.set(
      "Authorization",
      huaweiApigAuthorization({
        method: "POST",
        url,
        appKey: current.appKey ?? env("HUAWEI_APIG_APP_KEY"),
        appSecret: current.appSecret ?? env("HUAWEI_APIG_APP_SECRET"),
        xSdkDate,
        userAgent: current.userAgent,
        stage: current.stage,
      }),
    )
    headers.set("X-Sdk-Date", xSdkDate)
    headers.set("X-Stage", current.stage)
  }
  const response = await fetch(url, {
    method: "POST",
    headers,
  })
  const result = (await response.json()) as {
    code?: string
    status?: string
    ReturnStatus?: string
    description?: string
    error_msg?: string
    message?: string
    Message?: string
    msg?: string
  }
  const status = result.code ?? result.status ?? result.ReturnStatus
  const message = result.description ?? result.error_msg ?? result.message ?? result.Message ?? result.msg

  if (!response.ok) {
    throw new Error(message ?? "Failed to send verification code")
  }

  if (status && !["0", "000000", "200", "OK", "Success", "success", "Sucess"].includes(status)) {
    throw new Error(message ?? "Failed to send verification code")
  }
}

export namespace SMS {
  export function isConfigured(env = process.env) {
    return configured(env)
  }

  export function allowDevelopmentFallback(input: { stage: string; env?: Record<string, string | undefined> }) {
    return input.stage === "development" && !isConfigured(input.env ?? process.env)
  }

  export function assertConfigured() {
    config()
  }

  export async function sendLoginCode(input: { phone: string; code: string }) {
    const current = config()
    if (current.kind === "huawei_apig") return sendApigLoginCode(input, current)
    return sendLegacyLoginCode(input, current)
  }
}
