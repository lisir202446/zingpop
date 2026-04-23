import { describe, expect, test } from "bun:test"
import { resolveDatabaseConfig } from "../src/drizzle/config"

describe("resolveDatabaseConfig", () => {
  test("prefers DATABASE_URL for mysql connections", () => {
    const result = resolveDatabaseConfig({
      DATABASE_URL: "mysql://user:pass@db.example.com:3307/opencode",
    })

    expect(result.kind).toBe("mysql")
    expect(result.host).toBe("db.example.com")
    expect(result.port).toBe(3307)
    expect(result.user).toBe("user")
    expect(result.password).toBe("pass")
    expect(result.database).toBe("opencode")
  })

  test("supports discrete mysql env variables", () => {
    const result = resolveDatabaseConfig({
      MYSQL_HOST: "192.168.1.10",
      MYSQL_PORT: "3306",
      MYSQL_USER: "root",
      MYSQL_PASSWORD: "secret",
      MYSQL_DATABASE: "console",
      MYSQL_SSL: "true",
    })

    if (result.kind !== "mysql") throw new Error("expected mysql config")
    expect(result.kind).toBe("mysql")
    expect(result.host).toBe("192.168.1.10")
    expect(result.ssl).toBe(true)
  })

  test("falls back to planetscale resource values", () => {
    const result = resolveDatabaseConfig(
      {},
      {
        host: "ps.example.com",
        username: "planetscale",
        password: "ps-secret",
        database: "main",
        port: 3306,
      },
    )

    expect(result.kind).toBe("planetscale")
    expect(result.host).toBe("ps.example.com")
    expect(result.user).toBe("planetscale")
  })
})
