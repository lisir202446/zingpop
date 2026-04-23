import { Resource } from "sst"
import { defineConfig } from "drizzle-kit"
import { resolveDatabaseConfig } from "./src/drizzle/config"

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

const database = resolveDatabaseConfig(process.env, fallbackResource())

export default defineConfig({
  out: "./migrations/",
  strict: true,
  schema: ["./src/**/*.sql.ts"],
  verbose: true,
  dialect: "mysql",
  dbCredentials: {
    database: database.database,
    host: database.host,
    user: database.user,
    password: database.password,
    port: database.port,
    ssl: database.kind === "planetscale" || database.kind === "mysql" && database.ssl
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  },
})
