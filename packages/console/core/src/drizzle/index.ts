import { Resource } from "@opencode-ai/console-resource"
export * from "drizzle-orm"
import { Client } from "@planetscale/database"
import { createPool } from "mysql2/promise"
import { drizzle as mysqlDrizzle } from "drizzle-orm/mysql2"
import { drizzle as planetscaleDrizzle } from "drizzle-orm/planetscale-serverless"

import { MySqlDatabase, MySqlTransaction, type AnyMySqlQueryResultHKT, type MySqlTransactionConfig, type PreparedQueryHKTBase } from "drizzle-orm/mysql-core"
import { Context } from "../context"
import { memo } from "../util/memo"
import { resolveDatabaseConfig } from "./config"

export namespace Database {
  export type Transaction = MySqlTransaction<AnyMySqlQueryResultHKT, PreparedQueryHKTBase, Record<string, never>, any, any>

  type Db = MySqlDatabase<AnyMySqlQueryResultHKT, PreparedQueryHKTBase, Record<string, never>, any, any>

  function fallbackResource() {
    try {
      return {
        host: Resource.Database.host,
        username: Resource.Database.username,
        password: Resource.Database.password,
        database: Resource.Database.database,
        port: Resource.Database.port,
      }
    } catch {
      return undefined
    }
  }

  const client = memo(() => {
    const config = resolveDatabaseConfig(process.env, fallbackResource())

    if (config.kind === "mysql") {
      const pool = createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      })
      return mysqlDrizzle({ client: pool })
    }

    const client = new Client({
      host: config.host,
      username: config.user,
      password: config.password,
    })
    return planetscaleDrizzle({ client })
  })

  export type TxOrDb = Transaction | Db

  const TransactionContext = Context.create<{
    tx: TxOrDb
    effects: (() => void | Promise<void>)[]
  }>()

  export async function use<T>(callback: (trx: TxOrDb) => Promise<T>) {
    try {
      const { tx } = TransactionContext.use()
      return tx.transaction(callback)
    } catch (err) {
      if (err instanceof Context.NotFound) {
        const effects: (() => void | Promise<void>)[] = []
        const result = await TransactionContext.provide(
          {
            effects,
            tx: client(),
          },
          () => callback(client()),
        )
        await Promise.all(effects.map((x) => x()))
        return result
      }
      throw err
    }
  }
  export async function fn<Input, T>(callback: (input: Input, trx: TxOrDb) => Promise<T>) {
    return (input: Input) => use(async (tx) => callback(input, tx))
  }

  export async function effect(effect: () => any | Promise<any>) {
    try {
      const { effects } = TransactionContext.use()
      effects.push(effect)
    } catch {
      await effect()
    }
  }

  export async function transaction<T>(callback: (tx: TxOrDb) => Promise<T>, config?: MySqlTransactionConfig) {
    try {
      const { tx } = TransactionContext.use()
      return callback(tx)
    } catch (err) {
      if (err instanceof Context.NotFound) {
        const effects: (() => void | Promise<void>)[] = []
        const result = await client().transaction(async (tx) => {
          return TransactionContext.provide({ tx, effects }, () => callback(tx))
        }, config)
        await Promise.all(effects.map((x) => x()))
        return result
      }
      throw err
    }
  }
}
