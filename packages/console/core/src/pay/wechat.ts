import { decryptWechatResource, signWechatMessage, verifyWechatMessage } from "./crypto"
import { assertWechatConfigured, resolveDomesticPaymentConfig } from "./config"

function createNonce() {
  return crypto.randomUUID().replace(/-/g, "")
}

function authorization(input: {
  mchId: string
  serialNo: string
  privateKey: string
  method: string
  path: string
  body: string
}) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = createNonce()
  const message = `${input.method}\n${input.path}\n${timestamp}\n${nonce}\n${input.body}\n`
  const signature = signWechatMessage(message, input.privateKey)
  return {
    value: `WECHATPAY2-SHA256-RSA2048 mchid="${input.mchId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${input.serialNo}"`,
    timestamp,
    nonce,
  }
}

export async function createWechatOrder(input: {
  description: string
  orderID: string
  chargeFen: number
  clientIP: string
  redirectUrl?: string
}) {
  const config = assertWechatConfigured(resolveDomesticPaymentConfig(process.env))
  const path = "/v3/pay/transactions/h5"
  const body = JSON.stringify({
    appid: config.appId,
    mchid: config.mchId,
    description: input.description,
    out_trade_no: input.orderID,
    notify_url: config.notifyUrl,
    amount: {
      total: input.chargeFen,
      currency: "CNY",
    },
    scene_info: {
      payer_client_ip: input.clientIP,
      h5_info: {
        type: "Wap",
      },
    },
  })
  const signed = authorization({
    mchId: config.mchId,
    serialNo: config.serialNo,
    privateKey: config.privateKey,
    method: "POST",
    path,
    body,
  })
  const response = await fetch(`${config.apiBase}${path}`, {
    method: "POST",
    headers: {
      Authorization: signed.value,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body,
  })
  if (!response.ok) {
    throw new Error(`WeChat Pay order creation failed: ${await response.text()}`)
  }

  const result = (await response.json()) as {
    h5_url: string
  }
  if (!input.redirectUrl) return result.h5_url
  return `${result.h5_url}&redirect_url=${encodeURIComponent(input.redirectUrl)}`
}

export function verifyWechatNotification(input: {
  body: string
  timestamp: string
  nonce: string
  signature: string
}) {
  const config = assertWechatConfigured(resolveDomesticPaymentConfig(process.env))
  const message = `${input.timestamp}\n${input.nonce}\n${input.body}\n`
  return verifyWechatMessage(message, input.signature, config.platformCert)
}

export function decryptWechatNotification(body: string) {
  const config = assertWechatConfigured(resolveDomesticPaymentConfig(process.env))
  const parsed = JSON.parse(body) as {
    resource: {
      associated_data: string
      nonce: string
      ciphertext: string
    }
  }

  return JSON.parse(
    decryptWechatResource({
      apiV3Key: config.apiV3Key,
      associatedData: parsed.resource.associated_data,
      nonce: parsed.resource.nonce,
      ciphertext: parsed.resource.ciphertext,
    }),
  ) as Record<string, unknown>
}
