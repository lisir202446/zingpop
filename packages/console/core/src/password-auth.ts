import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { z } from "zod"
import { and, eq, isNull } from "./drizzle"
import { Database } from "./drizzle"
import { AuthTable } from "./schema/auth.sql"
import { AccountPasswordTable } from "./schema/account_password.sql"
import { Phone } from "./phone"
import { PhoneAuth } from "./phone-auth"
import { fn } from "./util/fn"

const scryptAsync = promisify(scrypt)
const PASSWORD_ALGORITHM = "scrypt-v1"
const PASSWORD_KEY_LENGTH = 64
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const PASSWORD_ATTEMPT_LIMIT = 5
export const PASSWORD_LOCK_MS = 15 * 60 * 1000
export const PASSWORD_LOGIN_FAILURE_MESSAGE = "Invalid phone number or password"
export const PASSWORD_RESET_FAILURE_MESSAGE = "Unable to reset password"

export function assertPasswordAllowed(password: string) {
  if (!password) throw new Error("Password is required")
  if (password.length < PASSWORD_MIN_LENGTH) throw new Error("Password must be at least 8 characters")
  if (password.length > PASSWORD_MAX_LENGTH) throw new Error("Password must be 128 characters or less")
}

export async function createPasswordHash(password: string) {
  assertPasswordAllowed(password)
  const salt = randomBytes(16).toString("base64url")
  const key = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer
  return `${PASSWORD_ALGORITHM}:${salt}:${key.toString("base64url")}`
}

export async function verifyPasswordHash(password: string, stored: string) {
  const parts = stored.split(":")
  if (parts.length !== 3) return false
  if (parts[0] !== PASSWORD_ALGORITHM) return false

  const actual = Buffer.from(parts[2], "base64url")
  const expected = (await scryptAsync(password, parts[1], actual.length)) as Buffer
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

async function setPassword(input: { accountID: string; password: string }) {
  const passwordHash = await createPasswordHash(input.password)
  await Database.use((tx) =>
    tx
      .insert(AccountPasswordTable)
      .values({
        accountID: input.accountID,
        passwordHash,
        passwordAlgorithm: PASSWORD_ALGORITHM,
        timePasswordUpdated: new Date(),
        failedAttemptCount: 0,
        lockedUntil: null,
      })
      .onDuplicateKeyUpdate({
        set: {
          passwordHash,
          passwordAlgorithm: PASSWORD_ALGORITHM,
          timePasswordUpdated: new Date(),
          failedAttemptCount: 0,
          lockedUntil: null,
          timeDeleted: null,
        },
      }),
  )
}

async function passwordForAccount(accountID: string) {
  return Database.use((tx) =>
    tx
      .select()
      .from(AccountPasswordTable)
      .where(and(eq(AccountPasswordTable.accountID, accountID), isNull(AccountPasswordTable.timeDeleted)))
      .limit(1)
      .then((rows) => rows[0]),
  )
}

async function accountForPhone(phone: string) {
  return Database.use((tx) =>
    tx
      .select({ accountID: AuthTable.accountID })
      .from(AuthTable)
      .where(and(eq(AuthTable.provider, "phone"), eq(AuthTable.subject, phone), isNull(AuthTable.timeDeleted)))
      .limit(1)
      .then((rows) => rows[0]?.accountID),
  )
}

async function recordFailedAttempt(input: { accountID: string; failedAttemptCount: number }) {
  const next = input.failedAttemptCount + 1
  await Database.use((tx) =>
    tx
      .update(AccountPasswordTable)
      .set({
        failedAttemptCount: next,
        lockedUntil: next >= PASSWORD_ATTEMPT_LIMIT ? new Date(Date.now() + PASSWORD_LOCK_MS) : null,
      })
      .where(eq(AccountPasswordTable.accountID, input.accountID)),
  )
}

export namespace PhonePasswordAuth {
  export const register = fn(
    z.object({
      phone: z.string(),
      code: z.string(),
      password: z.string(),
    }),
    async (input) => {
      assertPasswordAllowed(input.password)
      const result = await PhoneAuth.verifyCode({ phone: input.phone, code: input.code })
      if (await passwordForAccount(result.accountID)) throw new Error("Phone number already registered")
      await setPassword({ accountID: result.accountID, password: input.password })
      return result
    },
  )

  export const login = fn(
    z.object({
      phone: z.string(),
      password: z.string(),
    }),
    async (input) => {
      const phone = Phone.normalize(input.phone)
      const accountID = await accountForPhone(phone)
      if (!accountID) throw new Error(PASSWORD_LOGIN_FAILURE_MESSAGE)

      const password = await passwordForAccount(accountID)
      if (!password) throw new Error(PASSWORD_LOGIN_FAILURE_MESSAGE)
      if (password.lockedUntil && password.lockedUntil.getTime() > Date.now()) {
        throw new Error(PASSWORD_LOGIN_FAILURE_MESSAGE)
      }

      if (!(await verifyPasswordHash(input.password, password.passwordHash))) {
        await recordFailedAttempt({ accountID, failedAttemptCount: password.failedAttemptCount })
        throw new Error(PASSWORD_LOGIN_FAILURE_MESSAGE)
      }

      await Database.use((tx) =>
        tx
          .update(AccountPasswordTable)
          .set({
            failedAttemptCount: 0,
            lockedUntil: null,
          })
          .where(eq(AccountPasswordTable.accountID, accountID)),
      )

      return { accountID, phone }
    },
  )

  export const reset = fn(
    z.object({
      phone: z.string(),
      code: z.string(),
      password: z.string(),
    }),
    async (input) => {
      assertPasswordAllowed(input.password)
      const result = await PhoneAuth.verifyExistingCode({ phone: input.phone, code: input.code }).catch((error: Error) => {
        if (error.message === "Unable to reset password") throw new Error(PASSWORD_RESET_FAILURE_MESSAGE)
        throw error
      })
      await setPassword({ accountID: result.accountID, password: input.password })
      return result
    },
  )
}
