import { describe, expect, test } from "bun:test"
import { centsToMicroCents } from "../src/util/price"
import { quoteDomesticPayment, resolveDomesticPaymentConfig } from "../src/pay/config"

describe("domestic payment config", () => {
  test("uses sane defaults when rate is not provided", () => {
    const config = resolveDomesticPaymentConfig({})

    expect(config.cnyPerCredit).toBe(1)
    expect(config.alipay.gatewayUrl).toBe("https://openapi.alipay.com/gateway.do")
    expect(config.wechat.apiBase).toBe("https://api.mch.weixin.qq.com")
  })

  test("quotes cny charge and internal balance separately", () => {
    const result = quoteDomesticPayment({
      amount: 20,
      cnyPerCredit: 7.2,
    })

    expect(result.chargeFen).toBe(14400)
    expect(result.balanceMicroCents).toBe(centsToMicroCents(2000))
  })
})
