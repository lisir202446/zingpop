import type { APIEvent } from "@solidjs/start/server"
import { Billing } from "@opencode-ai/console-core/billing.js"

export async function POST(event: APIEvent) {
  const body = await event.request.text()
  const signature = event.request.headers.get("Wechatpay-Signature") ?? ""
  const nonce = event.request.headers.get("Wechatpay-Nonce") ?? ""
  const timestamp = event.request.headers.get("Wechatpay-Timestamp") ?? ""

  try {
    await Billing.handleWechatNotification({
      body,
      signature,
      nonce,
      timestamp,
    })
    return Response.json({ code: "SUCCESS", message: "成功" }, { status: 200 })
  } catch (error) {
    console.error("WeChat Pay notify failed", error)
    return Response.json({ code: "FAIL", message: "失败" }, { status: 400 })
  }
}
