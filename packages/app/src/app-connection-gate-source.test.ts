import { describe, expect, test } from "bun:test"

describe("ConnectionGate source", () => {
  test("does not wrap workbench children in a root Suspense fallback", async () => {
    const source = await Bun.file(new URL("./app.tsx", import.meta.url)).text()
    const start = source.indexOf("function ConnectionGate")
    const end = source.indexOf("function ConnectionError")

    expect(start).toBeGreaterThan(-1)
    expect(end).toBeGreaterThan(start)
    expect(source.slice(start, end)).not.toContain("<Suspense")
  })
})
