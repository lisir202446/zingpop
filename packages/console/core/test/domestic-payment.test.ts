import { describe, expect, test } from "bun:test"
import { createCipheriv, generateKeyPairSync } from "node:crypto"
import { decryptWechatResource, signAlipayPayload, verifyAlipayPayload, signWechatMessage, verifyWechatMessage } from "../src/pay/crypto"
import {
  allowDevelopmentPaymentFallback,
  buildDevelopmentCheckoutUrl,
  resolveDomesticPaymentConfig,
} from "../src/pay/config"

describe("domestic payment crypto helpers", () => {
  test("signs and verifies alipay payloads", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    })
    const payload = "app_id=123&method=alipay.trade.page.pay"
    const signature = signAlipayPayload(payload, privateKey.export({ type: "pkcs8", format: "pem" }).toString())

    expect(verifyAlipayPayload(payload, signature, publicKey.export({ type: "spki", format: "pem" }).toString())).toBe(
      true,
    )
  })

  test("signs and verifies wechat messages", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    })
    const message = "POST\n/v3/pay/transactions/native\n1710000000\nnonce\n{}\n"
    const signature = signWechatMessage(message, privateKey.export({ type: "pkcs8", format: "pem" }).toString())

    expect(verifyWechatMessage(message, signature, publicKey.export({ type: "spki", format: "pem" }).toString())).toBe(
      true,
    )
  })

  test("decrypts wechat notify resources", () => {
    const apiV3Key = "0123456789abcdef0123456789abcdef"
    const key = Buffer.from(apiV3Key)
    const nonce = Buffer.from("123456789012")
    const associatedData = Buffer.from("aad")
    const plaintext = Buffer.from(JSON.stringify({ out_trade_no: "ord_123", trade_state: "SUCCESS" }))
    const cipher = createCipheriv("aes-256-gcm", key, nonce)
    cipher.setAAD(associatedData)
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
    const authTag = cipher.getAuthTag()
    const encrypted = Buffer.concat([ciphertext, authTag]).toString("base64")

    expect(
      decryptWechatResource({
        apiV3Key,
        associatedData: associatedData.toString(),
        nonce: nonce.toString(),
        ciphertext: encrypted,
      }),
    ).toBe(plaintext.toString())
  })

  test("uses a local payment fallback when development providers are missing", () => {
    const config = resolveDomesticPaymentConfig({})

    expect(
      allowDevelopmentPaymentFallback({
        stage: "development",
        provider: "alipay",
        config,
      }),
    ).toBe(true)
    expect(
      allowDevelopmentPaymentFallback({
        stage: "development",
        provider: "wechat",
        config,
      }),
    ).toBe(true)
  })

  test("builds a local checkout url for development payment completion", () => {
    expect(
      buildDevelopmentCheckoutUrl({
        successUrl: "https://example.com/workspace/wrk_123/billing",
        orderID: "pay_123",
        provider: "wechat",
      }),
    ).toBe(
      "https://example.com/workspace/wrk_123/billing?checkout=dev&order=pay_123&provider=wechat",
    )
  })
})
