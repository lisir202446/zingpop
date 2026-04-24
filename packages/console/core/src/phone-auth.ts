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

export const LOGIN_CODE_TTL_MS = 5 * 60 * 1000
export const LOGIN_CODE_RESEND_MS = 60 * 1000
export const LOGIN_CODE_ATTEMPT_LIMIT = 5
export const LOGIN_CODE_DAILY_LIMIT = 50

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

      await Database.use((tx) =>
        tx.insert(LoginCodeTable).values({
          id: Identifier.create("login"),
          phone,
          codeHash: hashLoginCode(phone, code),
          expiresAt: new Date(now.getTime() + LOGIN_CODE_TTL_MS),
          ip: input.ip,
        }),
      )

      if (useDevelopmentFallback) return { phone, devCode: code }

      await SMS.sendLoginCode({ phone, code })

      return { phone }
    },
  )

  export const verifyCode = fn(
    z.object({
      phone: z.string(),
      code: z.string(),
    }),
    async (input) => {
      const phone = Phone.normalize(input.phone)
      const code = input.code.trim()

      if (!code) throw new Error("Verification code is required")

      return Database.transaction(async (tx) => {
        const now = new Date()
        const latestCode = await tx
          .select()
          .from(LoginCodeTable)
          .where(and(eq(LoginCodeTable.phone, phone), isNull(LoginCodeTable.timeDeleted)))
          .orderBy(desc(LoginCodeTable.timeCreated))
          .limit(1)
          .then((rows) => rows[0])

        if (!latestCode) throw new Error("Verification code has expired")

        assertCodeUsable({
          usedAt: latestCode.usedAt,
          expiresAt: latestCode.expiresAt,
          attemptCount: latestCode.attemptCount,
          now,
        })

        if (latestCode.codeHash !== hashLoginCode(phone, code)) {
          await tx
            .update(LoginCodeTable)
            .set({
              attemptCount: latestCode.attemptCount + 1,
            })
            .where(eq(LoginCodeTable.id, latestCode.id))
          throw new Error("Invalid verification code")
        }

        await tx
          .update(LoginCodeTable)
          .set({
            usedAt: now,
          })
          .where(eq(LoginCodeTable.id, latestCode.id))

        const existingAuth = await tx
          .select({
            accountID: AuthTable.accountID,
          })
          .from(AuthTable)
          .where(and(eq(AuthTable.provider, "phone"), eq(AuthTable.subject, phone)))
          .limit(1)
          .then((rows) => rows[0])

        if (existingAuth) {
          return {
            accountID: existingAuth.accountID,
            phone,
          }
        }

        const accountID = Identifier.create("account")

        await tx.insert(AccountTable).values({
          id: accountID,
        })

        await tx.insert(AuthTable).values({
          id: Identifier.create("auth"),
          provider: "phone",
          subject: phone,
          accountID,
        })

        return {
          accountID,
          phone,
        }
      })
    },
  )
}
