import { createHash, randomUUID } from "node:crypto"
import { Phone } from "./phone"

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error("SMS service is not configured")
  return value
}

function config() {
  return {
    endpoint: env("HUAWEI_SMS_ENDPOINT"),
    appKey: env("HUAWEI_SMS_APP_KEY"),
    appSecret: env("HUAWEI_SMS_APP_SECRET"),
    sender: env("HUAWEI_SMS_SENDER"),
    templateId: env("HUAWEI_SMS_TEMPLATE_ID"),
    signature: process.env.HUAWEI_SMS_SIGNATURE,
    statusCallback: process.env.HUAWEI_SMS_STATUS_CALLBACK,
  }
}

function wsse(appKey: string, appSecret: string) {
  const nonce = randomUUID().replace(/-/g, "")
  const created = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
  const passwordDigest = createHash("sha256").update(nonce + created + appSecret).digest("base64")
  return `UsernameToken Username="${appKey}",PasswordDigest="${passwordDigest}",Nonce="${nonce}",Created="${created}"`
}

export namespace SMS {
  export function assertConfigured() {
    config()
  }

  export async function sendLoginCode(input: { phone: string; code: string }) {
    const current = config()
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
}
