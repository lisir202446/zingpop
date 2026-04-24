import { Stripe } from "stripe"
import { and, Database, eq, isNull, sql } from "./drizzle"
import {
  BillingTable,
  CouponTable,
  CouponType,
  LiteTable,
  PaymentTable,
  SubscriptionTable,
  UsageTable,
} from "./schema/billing.sql"
import { Actor } from "./actor"
import { fn } from "./util/fn"
import { z } from "zod"
import { Resource } from "@opencode-ai/console-resource"
import { Identifier } from "./identifier"
import { centsToMicroCents } from "./util/price"
import { User } from "./user"
import { BlackData } from "./black"
import { LiteData } from "./lite"
import { createAlipayOrder, verifyAlipayNotification } from "./pay/alipay"
import {
  allowDevelopmentPaymentFallback,
  assertAlipayConfigured,
  assertWechatConfigured,
  buildDevelopmentCheckoutUrl,
  quoteDomesticPayment,
  resolveDomesticPaymentConfig,
  type DomesticPaymentProvider,
} from "./pay/config"
import { createWechatOrder, decryptWechatNotification, verifyWechatNotification } from "./pay/wechat"

export namespace Billing {
  export const ITEM_CREDIT_NAME = "Zingpop credits"
  export const ITEM_FEE_NAME = "processing fee"
  export const RELOAD_AMOUNT = 20
  export const RELOAD_AMOUNT_MIN = 10
  export const RELOAD_TRIGGER = 5
  export const RELOAD_TRIGGER_MIN = 5
  export const DOMESTIC_METHODS = ["alipay", "wechat"] as const
  export const stripe = () =>
    new Stripe(Resource.STRIPE_SECRET_KEY.value, {
      apiVersion: "2025-03-31.basil",
      httpClient: Stripe.createFetchHttpClient(),
    })

  function paymentConfig() {
    return resolveDomesticPaymentConfig(process.env)
  }

  function subjectFor(type: "credit" | "lite", amount: number) {
    if (type === "lite") return "Zingpop Lite"
    return `${ITEM_CREDIT_NAME} ${amount}`
  }

  async function createDomesticOrder(input: {
    type: "credit"
    amount: number
    successUrl: string
    cancelUrl: string
    provider: DomesticPaymentProvider
    clientIP: string
    mobile?: boolean
  }) {
    const config = paymentConfig()
    const orderID = Identifier.create("payment")
    const quote = quoteDomesticPayment({
      amount: input.amount,
      cnyPerCredit: config.cnyPerCredit,
    })

    await Database.use((tx) =>
      tx.insert(PaymentTable).values({
        workspaceID: Actor.workspace(),
        id: Identifier.create("payment"),
        orderID,
        channel: input.provider,
        status: "pending",
        amount: quote.balanceMicroCents,
        enrichment: {
          type: input.type,
          currency: "cny",
          provider: input.provider,
          rate: config.cnyPerCredit,
        },
      }),
    )

    try {
      if (input.provider === "alipay") {
        if (
          allowDevelopmentPaymentFallback({
            stage: Resource.App.stage,
            provider: input.provider,
            config,
          })
        ) {
          await markPaymentPaid({
            orderID,
            channel: input.provider,
            paymentID: `dev_${orderID}`,
            paidFen: quote.chargeFen,
            payload: {
              mode: "development",
              provider: input.provider,
            },
          })
          return buildDevelopmentCheckoutUrl({
            successUrl: input.successUrl,
            orderID,
            provider: input.provider,
          })
        }
        assertAlipayConfigured(config)
        return await createAlipayOrder({
          subject: subjectFor(input.type, input.amount),
          orderID,
          chargeFen: quote.chargeFen,
          returnUrl: input.successUrl,
          mobile: input.mobile,
        })
      }

      if (
        allowDevelopmentPaymentFallback({
          stage: Resource.App.stage,
          provider: input.provider,
          config,
        })
      ) {
        await markPaymentPaid({
          orderID,
          channel: input.provider,
          paymentID: `dev_${orderID}`,
          paidFen: quote.chargeFen,
          payload: {
            mode: "development",
            provider: input.provider,
          },
        })
        return buildDevelopmentCheckoutUrl({
          successUrl: input.successUrl,
          orderID,
          provider: input.provider,
        })
      }

      assertWechatConfigured(config)
      return await createWechatOrder({
        description: subjectFor(input.type, input.amount),
        orderID,
        chargeFen: quote.chargeFen,
        clientIP: input.clientIP,
        redirectUrl: input.successUrl,
      })
    } catch (error) {
      await Database.use((tx) =>
        tx
          .update(PaymentTable)
          .set({
            status: "failed",
          })
          .where(and(eq(PaymentTable.workspaceID, Actor.workspace()), eq(PaymentTable.orderID, orderID))),
      )
      throw error
    }
  }

  async function markPaymentPaid(input: {
    orderID: string
    channel: DomesticPaymentProvider
    paymentID: string
    paidFen: number
    payerID?: string
    receiptURL?: string
    payload: Record<string, unknown>
  }) {
    return Database.transaction(async (tx) => {
      const payment = await tx
        .select({
          workspaceID: PaymentTable.workspaceID,
          amount: PaymentTable.amount,
          status: PaymentTable.status,
        })
        .from(PaymentTable)
        .where(eq(PaymentTable.orderID, input.orderID))
        .limit(1)
        .then((rows) => rows[0])
      if (!payment) throw new Error("Payment order not found")
      if (payment.status === "paid" || payment.status === "refunded") return payment.workspaceID

      await tx
        .update(PaymentTable)
        .set({
          status: "paid",
          paymentID: input.paymentID,
          customerID: input.payerID,
          paidAmount: centsToMicroCents(input.paidFen),
          receiptURL: input.receiptURL,
          notifyPayload: input.payload,
          timePaid: new Date(),
        })
        .where(and(eq(PaymentTable.workspaceID, payment.workspaceID), eq(PaymentTable.orderID, input.orderID)))

      await tx
        .update(BillingTable)
        .set({
          balance: sql`${BillingTable.balance} + ${payment.amount}`,
          paymentMethodID: input.payerID,
          paymentMethodType: input.channel === "wechat" ? "wechat_pay" : "alipay",
          paymentMethodLast4: null,
          reloadError: null,
          timeReloadError: null,
        })
        .where(eq(BillingTable.workspaceID, payment.workspaceID))

      return payment.workspaceID
    })
  }

  export const get = async () => {
    return Database.use(async (tx) =>
      tx
        .select()
        .from(BillingTable)
        .where(eq(BillingTable.workspaceID, Actor.workspace()))
        .then((r) => r[0]),
    )
  }

  export const payments = async () => {
    return await Database.use((tx) =>
      tx
        .select()
        .from(PaymentTable)
        .where(eq(PaymentTable.workspaceID, Actor.workspace()))
        .orderBy(sql`${PaymentTable.timeCreated} DESC`)
        .limit(100),
    )
  }

  export const usages = async (page = 0, pageSize = 50) => {
    return await Database.use((tx) =>
      tx
        .select()
        .from(UsageTable)
        .where(eq(UsageTable.workspaceID, Actor.workspace()))
        .orderBy(sql`${UsageTable.timeCreated} DESC`)
        .limit(pageSize)
        .offset(page * pageSize),
    )
  }

  export const calculateFeeInCents = (x: number) => {
    // math: x = total - (total * 0.044 + 0.30)
    // math: x = total * (1-0.044) - 0.30
    // math: (x + 0.30) / 0.956 = total
    return Math.round(((x + 30) / 0.956) * 0.044 + 30)
  }

  export const reload = async () => {
    const billing = await Database.use((tx) =>
      tx
        .select({
          customerID: BillingTable.customerID,
          paymentMethodID: BillingTable.paymentMethodID,
          reloadAmount: BillingTable.reloadAmount,
        })
        .from(BillingTable)
        .where(eq(BillingTable.workspaceID, Actor.workspace()))
        .then((rows) => rows[0]),
    )
    const customerID = billing.customerID
    const paymentMethodID = billing.paymentMethodID
    const amountInCents = (billing.reloadAmount ?? Billing.RELOAD_AMOUNT) * 100
    try {
      const draft = await Billing.stripe().invoices.create({
        customer: customerID!,
        auto_advance: false,
        default_payment_method: paymentMethodID!,
        collection_method: "charge_automatically",
        currency: "usd",
        metadata: {
          workspaceID: Actor.workspace(),
          amount: amountInCents.toString(),
        },
      })
      await Billing.stripe().invoiceItems.create({
        amount: amountInCents,
        currency: "usd",
        customer: customerID!,
        invoice: draft.id!,
        description: ITEM_CREDIT_NAME,
      })
      await Billing.stripe().invoiceItems.create({
        amount: calculateFeeInCents(amountInCents),
        currency: "usd",
        customer: customerID!,
        invoice: draft.id!,
        description: ITEM_FEE_NAME,
      })
      await Billing.stripe().invoices.finalizeInvoice(draft.id!)
      await Billing.stripe().invoices.pay(draft.id!, {
        off_session: true,
        payment_method: paymentMethodID!,
      })
    } catch (e: any) {
      console.error(e)
      await Database.use((tx) =>
        tx
          .update(BillingTable)
          .set({
            reload: false,
            reloadError: e.message ?? "Payment failed.",
            timeReloadError: sql`now()`,
          })
          .where(eq(BillingTable.workspaceID, Actor.workspace())),
      )
      return
    }
  }

  export const grantCredit = async (workspaceID: string, dollarAmount: number) => {
    const amountInMicroCents = centsToMicroCents(dollarAmount * 100)
    await Database.transaction(async (tx) => {
      await tx
        .update(BillingTable)
        .set({
          balance: sql`${BillingTable.balance} + ${amountInMicroCents}`,
        })
        .where(eq(BillingTable.workspaceID, workspaceID))
      await tx.insert(PaymentTable).values({
        workspaceID,
        id: Identifier.create("payment"),
        amount: amountInMicroCents,
        enrichment: {
          type: "credit",
        },
      })
    })
    return amountInMicroCents
  }

  export const redeemCoupon = async (email: string, type: (typeof CouponType)[number]) => {
    const coupon = await Database.use((tx) =>
      tx
        .select()
        .from(CouponTable)
        .where(and(eq(CouponTable.email, email), eq(CouponTable.type, type)))
        .then((rows) => rows[0]),
    )
    if (!coupon) throw new Error("Invalid coupon code")
    if (coupon.timeRedeemed) throw new Error("Coupon already redeemed")

    if (type === "BUILDATHON") await grantCredit(Actor.workspace(), 500)

    await Database.use((tx) =>
      tx
        .update(CouponTable)
        .set({ timeRedeemed: sql`now()` })
        .where(and(eq(CouponTable.email, email), eq(CouponTable.type, type))),
    )
  }

  export const hasCoupon = async (email: string, type: (typeof CouponType)[number]) => {
    return await Database.use((tx) =>
      tx
        .select()
        .from(CouponTable)
        .where(and(eq(CouponTable.email, email), eq(CouponTable.type, type), isNull(CouponTable.timeRedeemed)))
        .then((rows) => rows.length > 0),
    )
  }

  export const setMonthlyLimit = fn(z.number(), async (input) => {
    return await Database.use((tx) =>
      tx
        .update(BillingTable)
        .set({
          monthlyLimit: input,
        })
        .where(eq(BillingTable.workspaceID, Actor.workspace())),
    )
  })

  export const generateCheckoutUrl = fn(
    z.object({
      successUrl: z.string(),
      cancelUrl: z.string(),
      amount: z.number().optional(),
      provider: z.enum(DOMESTIC_METHODS).default("alipay"),
      clientIP: z.string().default("127.0.0.1"),
      mobile: z.boolean().optional(),
    }),
    async (input) => {
      const { successUrl, cancelUrl, amount, provider, clientIP, mobile } = input

      if (amount !== undefined && amount < Billing.RELOAD_AMOUNT_MIN) {
        throw new Error(`Amount must be at least $${Billing.RELOAD_AMOUNT_MIN}`)
      }

      const customer = await Billing.get()
      return createDomesticOrder({
        type: "credit",
        amount: amount ?? customer.reloadAmount ?? Billing.RELOAD_AMOUNT,
        successUrl,
        cancelUrl,
        provider,
        clientIP,
        mobile,
      })
    },
  )

  export const generateLiteCheckoutUrl = fn(
    z.object({
      successUrl: z.string(),
      cancelUrl: z.string(),
      method: z.enum(["alipay", "wechat"]).optional(),
      clientIP: z.string().default("127.0.0.1"),
      mobile: z.boolean().optional(),
    }),
    async (input) => {
      const { successUrl, cancelUrl, method, clientIP, mobile } = input
      const billing = await Billing.get()

      if (billing.subscriptionID) throw new Error("Already subscribed to Black")
      if (billing.liteSubscriptionID) throw new Error("Already subscribed to Lite")
      throw new Error("Lite checkout has not been migrated to domestic payments yet")
    },
  )

  export const generateSessionUrl = fn(
    z.object({
      returnUrl: z.string(),
    }),
    async (input) => {
      return input.returnUrl
    },
  )

  export const generateReceiptUrl = fn(
    z.object({
      paymentID: z.string(),
    }),
    async (input) => {
      const payment = await Database.use((tx) =>
        tx
          .select({
            receiptURL: PaymentTable.receiptURL,
          })
          .from(PaymentTable)
          .where(and(eq(PaymentTable.workspaceID, Actor.workspace()), eq(PaymentTable.paymentID, input.paymentID)))
          .limit(1)
          .then((rows) => rows[0]),
      )
      if (!payment?.receiptURL) throw new Error("No receipt URL found")
      return payment.receiptURL
    },
  )

  export async function handleAlipayNotification(payload: Record<string, string>) {
    if (!verifyAlipayNotification(payload)) throw new Error("Invalid Alipay signature")
    if (!["TRADE_SUCCESS", "TRADE_FINISHED"].includes(payload.trade_status ?? "")) return
    if (!payload.out_trade_no || !payload.trade_no || !payload.total_amount) throw new Error("Invalid Alipay payload")

    await markPaymentPaid({
      orderID: payload.out_trade_no,
      channel: "alipay",
      paymentID: payload.trade_no,
      paidFen: Math.round(Number(payload.total_amount) * 100),
      payerID: payload.buyer_id,
      payload,
    })
  }

  export async function handleWechatNotification(input: {
    body: string
    timestamp: string
    nonce: string
    signature: string
  }) {
    if (!verifyWechatNotification(input)) throw new Error("Invalid WeChat Pay signature")
    const payload = decryptWechatNotification(input.body)
    const orderID = String(payload.out_trade_no ?? "")
    const paymentID = String(payload.transaction_id ?? "")
    const status = String(payload.trade_state ?? "")
    const amount = payload.amount as { total?: number } | undefined
    const payer = payload.payer as { openid?: string } | undefined

    if (status !== "SUCCESS") return
    if (!orderID || !paymentID || !amount?.total) throw new Error("Invalid WeChat Pay payload")

    await markPaymentPaid({
      orderID,
      channel: "wechat",
      paymentID,
      paidFen: amount.total,
      payerID: payer?.openid,
      payload,
    })
  }

  export const subscribeBlack = fn(
    z.object({
      seats: z.number(),
      coupon: z.string().optional(),
    }),
    async ({ seats, coupon }) => {
      const user = Actor.assert("user")
      const billing = await Database.use((tx) =>
        tx
          .select({
            customerID: BillingTable.customerID,
            paymentMethodID: BillingTable.paymentMethodID,
            subscriptionID: BillingTable.subscriptionID,
            subscriptionPlan: BillingTable.subscriptionPlan,
            timeSubscriptionSelected: BillingTable.timeSubscriptionSelected,
          })
          .from(BillingTable)
          .where(eq(BillingTable.workspaceID, Actor.workspace()))
          .then((rows) => rows[0]),
      )

      if (!billing) throw new Error("Billing record not found")
      if (!billing.timeSubscriptionSelected) throw new Error("Not selected for subscription")
      if (billing.subscriptionID) throw new Error("Already subscribed")
      if (!billing.customerID) throw new Error("No customer ID")
      if (!billing.paymentMethodID) throw new Error("No payment method")
      if (!billing.subscriptionPlan) throw new Error("No subscription plan")

      const subscription = await Billing.stripe().subscriptions.create({
        customer: billing.customerID,
        default_payment_method: billing.paymentMethodID,
        items: [{ price: BlackData.planToPriceID({ plan: billing.subscriptionPlan }) }],
        metadata: {
          workspaceID: Actor.workspace(),
        },
      })

      await Database.transaction(async (tx) => {
        await tx
          .update(BillingTable)
          .set({
            subscriptionID: subscription.id,
            subscription: {
              status: "subscribed",
              coupon,
              seats,
              plan: billing.subscriptionPlan!,
            },
            subscriptionPlan: null,
            timeSubscriptionBooked: null,
            timeSubscriptionSelected: null,
          })
          .where(eq(BillingTable.workspaceID, Actor.workspace()))

        await tx.insert(SubscriptionTable).values({
          workspaceID: Actor.workspace(),
          id: Identifier.create("subscription"),
          userID: user.properties.userID,
        })
      })

      return subscription.id
    },
  )

  export const unsubscribeBlack = fn(
    z.object({
      subscriptionID: z.string(),
    }),
    async ({ subscriptionID }) => {
      const workspaceID = await Database.use((tx) =>
        tx
          .select({ workspaceID: BillingTable.workspaceID })
          .from(BillingTable)
          .where(eq(BillingTable.subscriptionID, subscriptionID))
          .then((rows) => rows[0]?.workspaceID),
      )
      if (!workspaceID) throw new Error("Workspace ID not found for subscription")

      await Database.transaction(async (tx) => {
        await tx
          .update(BillingTable)
          .set({ subscriptionID: null, subscription: null })
          .where(eq(BillingTable.workspaceID, workspaceID))

        await tx.delete(SubscriptionTable).where(eq(SubscriptionTable.workspaceID, workspaceID))
      })
    },
  )

  export const unsubscribeLite = fn(
    z.object({
      subscriptionID: z.string(),
    }),
    async ({ subscriptionID }) => {
      const workspaceID = await Database.use((tx) =>
        tx
          .select({ workspaceID: BillingTable.workspaceID })
          .from(BillingTable)
          .where(eq(BillingTable.liteSubscriptionID, subscriptionID))
          .then((rows) => rows[0]?.workspaceID),
      )
      if (!workspaceID) throw new Error("Workspace ID not found for subscription")

      await Database.transaction(async (tx) => {
        await tx
          .update(BillingTable)
          .set({ liteSubscriptionID: null, lite: null })
          .where(eq(BillingTable.workspaceID, workspaceID))

        await tx.delete(LiteTable).where(eq(LiteTable.workspaceID, workspaceID))
      })
    },
  )
}
