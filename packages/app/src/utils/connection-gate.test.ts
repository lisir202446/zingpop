import { describe, expect, test } from "bun:test"
import { connectionGateView } from "./connection-gate"

describe("connectionGateView", () => {
  test("shows the startup splash only while the blocking health check is unresolved", () => {
    expect(connectionGateView({ blocking: true, loading: true })).toBe("loading")
    expect(connectionGateView({ blocking: false, loading: true, latest: true })).toBe("ready")
    expect(connectionGateView({ blocking: true, loading: true, latest: true })).toBe("ready")
  })

  test("keeps failed health checks on the connection error state", () => {
    expect(connectionGateView({ blocking: true, loading: false, latest: false })).toBe("error")
    expect(connectionGateView({ blocking: false, loading: true, latest: false })).toBe("error")
  })
})
