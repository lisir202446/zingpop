import { createHmac } from "node:crypto"
import { z } from "zod"
import { AccountTable } from "./schema/account.sql"
import { AuthTable } from "./schema/auth.sql"
import { LoginCodeTable } from "./schema/login_code.sql"
import { Database, and, desc, eq, gte, isNull } from "./drizzle"
import { Identifier } from "./identifier"
import { Phone } from "./phone"
import { Resource } from "@opencode-ai/console-resource"
import { SMS } from "./sms"
import { fn } from "./util/fn"

export const LOGIN_CODE_TTL_MS = 3 * 60 * 1000
export const LOGIN_CODE_RESEND_MS = 60 * 1000
export const LOGIN_CODE_ATTEMPT_LIMIT = 5
export const LOGIN_CODE_DAILY_LIMIT = 50
const SEND_CODE_PUBLIC_ERRORS = [
  "Invalid phone number",
  "Please wait before requesting another verification code",
  "Daily verification code limit reached",
] as const

export function hashLoginCode(phone: string, code: string) {
  return createHmac("sha256", Resource.ZEN_SESSION_SECRET.value).update(`${phone}:${code}`).digest("hex")
}

function generateLoginCode() {
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0")
}

export function assertCanSendCode(input: { latestSentAt?: Date | null; dailyCount: number; now: Date }) {
  if (input.latestSentAt && input.now.getTime() - input.latestSentAt.getTime() < LOGIN_CODE_RESEND_MS) {
    throw new Error("Please wait before requesting another verification code")
  }

  if (input.dailyCount >= LOGIN_CODE_DAILY_LIMIT) {
    throw new Error("Daily verification code limit reached")
  }
}

export function assertCodeUsable(input: {
  usedAt?: Date | null
  expiresAt: Date
  attemptCount: number
  now: Date
}) {
  if (input.usedAt) throw new Error("Verification code has expired")
  if (input.expiresAt.getTime() <= input.now.getTime()) throw new Error("Verification code has expired")
  if (input.attemptCount >= LOGIN_CODE_ATTEMPT_LIMIT) throw new Error("Too many invalid verification attempts")
}

export function publicSendCodeFailureMessage(error: Error) {
  if (SEND_CODE_PUBLIC_ERRORS.includes(error.message as (typeof SEND_CODE_PUBLIC_ERRORS)[number])) return error.message
  return "Failed to send verification code"
}

async function consumeLoginCode(input: { tx: Database.TxOrDb; phone: string; code: string }) {
  const latestCode = await input.tx
    .select()
    .from(LoginCodeTable)
    .where(and(eq(LoginCodeTable.phone, input.phone), isNull(LoginCodeTable.timeDeleted)))
    .orderBy(desc(LoginCodeTable.timeCreated))
    .limit(1)
    .then((rows) => rows[0])

  if (!latestCode) throw new Error("Verification code has expired")

  const now = new Date()
  assertCodeUsable({
    usedAt: latestCode.usedAt,
    expiresAt: latestCode.expiresAt,
    attemptCount: latestCode.attemptCount,
    now,
  })

  if (latestCode.codeHash !== hashLoginCode(input.phone, input.code)) {
    await input.tx
      .update(LoginCodeTable)
      .set({
        attemptCount: latestCode.attemptCount + 1,
      })
      .where(eq(LoginCodeTable.id, latestCode.id))
    throw new Error("Invalid verification code")
  }

  await input.tx
    .update(LoginCodeTable)
    .set({
      usedAt: now,
    })
    .where(eq(LoginCodeTable.id, latestCode.id))
}

async function phoneAccount(input: { tx: Database.TxOrDb; phone: string }) {
  return input.tx
    .select({
      accountID: AuthTable.accountID,
    })
    .from(AuthTable)
    .where(and(eq(AuthTable.provider, "phone"), eq(AuthTable.subject, input.phone), isNull(AuthTable.timeDeleted)))
    .limit(1)
    .then((rows) => rows[0]?.accountID)
}

async function createPhoneAccount(input: { tx: Database.TxOrDb; phone: string }) {
  const accountID = Identifier.create("account")

  await input.tx.insert(AccountTable).values({
    id: accountID,
  })

  await input.tx.insert(AuthTable).values({
    id: Identifier.create("auth"),
    provider: "phone",
    subject: input.phone,
    accountID,
  })

  return accountID
}

async function verifyCodeForAccount(input: { phone: string; code: string; createAccount: boolean }) {
  const phone = Phone.normalize(input.phone)
  const code = input.code.trim()

  if (!code) throw new Error("Verification code is required")

  return Database.transaction(async (tx) => {
    await consumeLoginCode({ tx, phone, code })

    const accountID = (await phoneAccount({ tx, phone })) ?? (input.createAccount ? await createPhoneAccount({ tx, phone }) : undefined)
    if (!accountID) throw new Error("Unable to reset password")

    return {
      accountID,
      phone,
    }
  })
}

export namespace PhoneAuth {
  export const sendCode = fn(
    z.object({
      phone: z.string(),
      ip: z.string().optional(),
    }),
    async (input) => {
      const phone = Phone.normalize(input.phone)
      const now = new Date()
      const latestCode = await Database.use((tx) =>
        tx
          .select({
            timeCreated: LoginCodeTable.timeCreated,
          })
          .from(LoginCodeTable)
          .where(and(eq(LoginCodeTable.phone, phone), isNull(LoginCodeTable.timeDeleted)))
          .orderBy(desc(LoginCodeTable.timeCreated))
          .limit(1)
          .then((rows) => rows[0]),
      )
      const dailyCount = await Database.use((tx) =>
        tx
          .select({
            id: LoginCodeTable.id,
          })
          .from(LoginCodeTable)
          .where(
            and(
              eq(LoginCodeTable.phone, phone),
              isNull(LoginCodeTable.timeDeleted),
              gte(LoginCodeTable.timeCreated, new Date(now.getTime() - 24 * 60 * 60 * 1000)),
            ),
          )
          .limit(LOGIN_CODE_DAILY_LIMIT)
          .then((rows) => rows.length),
      )

      assertCanSendCode({
        latestSentAt: latestCode?.timeCreated,
        dailyCount,
        now,
      })

      const code = generateLoginCode()
      const useDevelopmentFallback = SMS.allowDevelopmentFallback({
        stage: Resource.App.stage,
      })
      const loginCodeID = Identifier.create("login")

      await Database.use((tx) =>
        tx.insert(LoginCodeTable).values({
          id: loginCodeID,
          phone,
          codeHash: hashLoginCode(phone, code),
          expiresAt: new Date(now.getTime() + LOGIN_CODE_TTL_MS),
          ip: input.ip,
        }),
      )

      if (useDevelopmentFallback) return { phone, devCode: code }

      try {
        await SMS.sendLoginCode({ phone, code })
      } catch (error) {
        await Database.use((tx) =>
          tx
            .update(LoginCodeTable)
            .set({
              timeDeleted: new Date(),
            })
            .where(eq(LoginCodeTable.id, loginCodeID)),
        ).catch((cleanupError) => {
          console.error("Failed to cleanup unsent phone verification code", {
            phone: Phone.mask(phone),
            error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
          })
        })
        console.error("Failed to send phone verification code", {
          phone: Phone.mask(phone),
          error: error instanceof Error ? error.message : String(error),
        })
        throw new Error(publicSendCodeFailureMessage(error instanceof Error ? error : new Error(String(error))))
      }

      return { phone }
    },
  )

  export const verifyCode = fn(
    z.object({
      phone: z.string(),
      code: z.string(),
    }),
    (input) => verifyCodeForAccount({ ...input, createAccount: true }),
  )

  export const verifyExistingCode = fn(
    z.object({
      phone: z.string(),
      code: z.string(),
    }),
    (input) => verifyCodeForAccount({ ...input, createAccount: false }),
  )
}
