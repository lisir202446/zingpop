export interface DatabaseResourceFallback {
  host: string
  username: string
  password: string
  database: string
  port?: number
}

export type DatabaseConfig =
  | {
      kind: "mysql"
      host: string
      port: number
      user: string
      password: string
      database: string
      ssl: boolean
    }
  | {
      kind: "planetscale"
      host: string
      port: number
      user: string
      password: string
      database: string
    }

function parseBoolean(value?: string | null) {
  return ["1", "true", "yes", "on"].includes((value ?? "").toLowerCase())
}

function parseDatabaseUrl(value: string) {
  const url = new URL(value)
  if (!["mysql:", "mysql2:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL must use the mysql protocol")
  }

  return {
    kind: "mysql" as const,
    host: url.hostname,
    port: Number(url.port || "3306"),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: parseBoolean(url.searchParams.get("ssl")) || parseBoolean(url.searchParams.get("sslmode")),
  }
}

export function resolveDatabaseConfig(
  env: Record<string, string | undefined>,
  fallback?: DatabaseResourceFallback,
): DatabaseConfig {
  if (env.DATABASE_URL) return parseDatabaseUrl(env.DATABASE_URL)

  if (env.MYSQL_HOST && env.MYSQL_USER && env.MYSQL_DATABASE) {
    return {
      kind: "mysql",
      host: env.MYSQL_HOST,
      port: Number(env.MYSQL_PORT || "3306"),
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD ?? "",
      database: env.MYSQL_DATABASE,
      ssl: parseBoolean(env.MYSQL_SSL),
    }
  }

  if (fallback) {
    return {
      kind: "planetscale",
      host: fallback.host,
      port: fallback.port ?? 3306,
      user: fallback.username,
      password: fallback.password,
      database: fallback.database,
    }
  }

  throw new Error("Database configuration not found")
}
