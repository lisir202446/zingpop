import { centsToMicroCents } from "../util/price"

export type DomesticPaymentProvider = "alipay" | "wechat"

export function resolveDomesticPaymentConfig(env: Record<string, string | undefined>) {
  return {
    cnyPerCredit: Number(env.DOMESTIC_PAYMENT_CNY_PER_CREDIT || "1"),
    alipay: {
      appId: env.ALIPAY_APP_ID,
      privateKey: env.ALIPAY_PRIVATE_KEY,
      publicKey: env.ALIPAY_PUBLIC_KEY,
      notifyUrl: env.ALIPAY_NOTIFY_URL,
      returnUrl: env.ALIPAY_RETURN_URL,
      gatewayUrl: env.ALIPAY_GATEWAY_URL || "https://openapi.alipay.com/gateway.do",
    },
    wechat: {
      appId: env.WECHAT_PAY_APP_ID,
      mchId: env.WECHAT_PAY_MCH_ID,
      serialNo: env.WECHAT_PAY_SERIAL_NO,
      privateKey: env.WECHAT_PAY_PRIVATE_KEY,
      platformCert: env.WECHAT_PAY_PLATFORM_CERT,
      apiV3Key: env.WECHAT_PAY_V3_KEY,
      notifyUrl: env.WECHAT_PAY_NOTIFY_URL,
      apiBase: env.WECHAT_PAY_API_BASE || "https://api.mch.weixin.qq.com",
    },
  }
}

export function quoteDomesticPayment(input: { amount: number; cnyPerCredit: number }) {
  return {
    chargeFen: Math.round(input.amount * input.cnyPerCredit * 100),
    balanceMicroCents: centsToMicroCents(input.amount * 100),
  }
}

export function assertAlipayConfigured(config: ReturnType<typeof resolveDomesticPaymentConfig>) {
  if (
    !config.alipay.appId ||
    !config.alipay.privateKey ||
    !config.alipay.publicKey ||
    !config.alipay.notifyUrl
  ) {
    throw new Error("Alipay is not configured")
  }

  return {
    appId: config.alipay.appId,
    privateKey: config.alipay.privateKey,
    publicKey: config.alipay.publicKey,
    notifyUrl: config.alipay.notifyUrl,
    returnUrl: config.alipay.returnUrl,
    gatewayUrl: config.alipay.gatewayUrl,
  }
}

export function assertWechatConfigured(config: ReturnType<typeof resolveDomesticPaymentConfig>) {
  if (
    !config.wechat.appId ||
    !config.wechat.mchId ||
    !config.wechat.serialNo ||
    !config.wechat.privateKey ||
    !config.wechat.platformCert ||
    !config.wechat.apiV3Key ||
    !config.wechat.notifyUrl
  ) {
    throw new Error("WeChat Pay is not configured")
  }

  return {
    appId: config.wechat.appId,
    mchId: config.wechat.mchId,
    serialNo: config.wechat.serialNo,
    privateKey: config.wechat.privateKey,
    platformCert: config.wechat.platformCert,
    apiV3Key: config.wechat.apiV3Key,
    notifyUrl: config.wechat.notifyUrl,
    apiBase: config.wechat.apiBase,
  }
}
