import { signAlipayPayload, verifyAlipayPayload } from "./crypto"
import { assertAlipayConfigured, resolveDomesticPaymentConfig } from "./config"

function encode(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+")
}

function serialize(params: Record<string, string>) {
  return Object.entries(params)
    .filter(([, value]) => value.length > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")
}

function buildRequest(params: Record<string, string>, privateKey: string) {
  const payload = serialize(params)
  const signature = signAlipayPayload(payload, privateKey)
  return `${Object.entries(params)
    .filter(([, value]) => value.length > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encode(key)}=${encode(value)}`)
    .join("&")}&sign=${encode(signature)}`
}

export async function createAlipayOrder(input: {
  subject: string
  orderID: string
  chargeFen: number
  returnUrl?: string
  mobile?: boolean
}) {
  const config = assertAlipayConfigured(resolveDomesticPaymentConfig(process.env))
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ")
  const bizContent = JSON.stringify({
    out_trade_no: input.orderID,
    total_amount: (input.chargeFen / 100).toFixed(2),
    subject: input.subject,
    product_code: input.mobile ? "QUICK_WAP_WAY" : "FAST_INSTANT_TRADE_PAY",
  })
  const query = buildRequest(
    {
      app_id: config.appId,
      method: input.mobile ? "alipay.trade.wap.pay" : "alipay.trade.page.pay",
      charset: "utf-8",
      sign_type: "RSA2",
      timestamp,
      version: "1.0",
      notify_url: config.notifyUrl,
      return_url: input.returnUrl ?? config.returnUrl ?? "",
      biz_content: bizContent,
    },
    config.privateKey,
  )

  return `${config.gatewayUrl}?${query}`
}

export function verifyAlipayNotification(input: URLSearchParams | Record<string, string>) {
  const config = assertAlipayConfigured(resolveDomesticPaymentConfig(process.env))
  const params = input instanceof URLSearchParams ? Object.fromEntries(input.entries()) : input
  const signature = params.sign
  if (!signature) return false

  const payload = serialize(
    Object.fromEntries(
      Object.entries(params).filter(([key, value]) => key !== "sign" && key !== "sign_type" && typeof value === "string"),
    ) as Record<string, string>,
  )
  return verifyAlipayPayload(payload, signature, config.publicKey)
}
