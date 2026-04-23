import type { APIEvent } from "@solidjs/start/server"
import { Billing } from "@opencode-ai/console-core/billing.js"

export async function POST(event: APIEvent) {
  const form = await event.request.formData()
  const payload = Object.fromEntries(Array.from(form.entries()).map(([key, value]) => [key, String(value)]))

  try {
    await Billing.handleAlipayNotification(payload)
    return new Response("success", { status: 200 })
  } catch (error) {
    console.error("Alipay notify failed", error)
    return new Response("failure", { status: 400 })
  }
}
