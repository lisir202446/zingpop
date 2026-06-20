import { describe, expect, test } from "bun:test"
import { handleConsolePipeError, isPipeError } from "./logging-pipe"

describe("desktop logging", () => {
  test("ignores broken stdout and stderr pipes", () => {
    const error = Object.assign(new Error("broken pipe"), { code: "EPIPE" })

    expect(isPipeError(error)).toBe(true)
    expect(() => handleConsolePipeError(error)).not.toThrow()
  })

  test("does not hide non-pipe logging failures", () => {
    const error = Object.assign(new Error("write failed"), { code: "EACCES" })

    expect(isPipeError(error)).toBe(false)
    expect(() => handleConsolePipeError(error)).toThrow(error)
  })
})
