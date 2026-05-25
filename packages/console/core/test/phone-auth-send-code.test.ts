import { beforeAll, describe, expect, mock, test } from "bun:test"

const writes: {
  inserted?: { id: string; phone: string }
  deleted?: { timeDeleted?: Date }
} = {}

beforeAll(() => {
  mock.module("@opencode-ai/console-resource", () => ({
    Resource: {
      App: {
        stage: "production",
      },
      ZEN_SESSION_SECRET: {
        value: "test-secret",
      },
    },
  }))

  mock.module("../src/sms", () => ({
    SMS: {
      allowDevelopmentFallback: () => false,
      sendLoginCode: async () => {
        throw new Error("provider rejected template")
      },
    },
  }))

  mock.module("../src/drizzle", () => ({
    and: (...values: unknown[]) => values,
    desc: (value: unknown) => value,
    eq: (...values: unknown[]) => values,
    gte: (...values: unknown[]) => values,
    isNull: (value: unknown) => value,
    Database: {
      use: async (callback: (tx: unknown) => Promise<unknown>) => callback(fakeTx()),
    },
  }))
})

function fakeTx() {
  const selectRows = typeof writes.inserted === "undefined" ? [] : [{ timeCreated: new Date() }]
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve(selectRows),
          }),
          limit: () => Promise.resolve([]),
        }),
      }),
    }),
    insert: () => ({
      values: (value: { id: string; phone: string }) => {
        writes.inserted = {
          id: value.id,
          phone: value.phone,
        }
        return Promise.resolve()
      },
    }),
    update: () => ({
      set: (value: { timeDeleted?: Date }) => ({
        where: () => {
          writes.deleted = value
          return Promise.resolve()
        },
      }),
    }),
  }
}

describe("phone auth send code cleanup", () => {
  test("soft deletes the inserted login code when sms delivery fails", async () => {
    const previousConsoleError = console.error
    const { PhoneAuth } = await import("../src/phone-auth")

    console.error = () => {}

    try {
      await expect(
        PhoneAuth.sendCode({
          phone: "18122488704",
        }),
      ).rejects.toThrow("Failed to send verification code")
    } finally {
      console.error = previousConsoleError
    }

    expect(writes.inserted?.phone).toBe("18122488704")
    expect(writes.deleted?.timeDeleted).toBeInstanceOf(Date)
  })
})
