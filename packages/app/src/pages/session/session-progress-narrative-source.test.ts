import { describe, expect, test } from "bun:test"

describe("session progress narrative source integration", () => {
  test("message timeline passes Zingpop progress narrative through the assistant prefix", async () => {
    const source = await Bun.file(new URL("./message-timeline.tsx", import.meta.url)).text()
    const importIndex = source.indexOf("SessionProgressNarrative")
    const turnIndex = source.indexOf("<SessionTurn")
    const prefixIndex = source.indexOf("assistantPrefix={")
    const narrativeIndex = source.indexOf("<SessionProgressNarrative")

    expect(importIndex).toBeGreaterThan(-1)
    expect(turnIndex).toBeGreaterThan(-1)
    expect(prefixIndex).toBeGreaterThan(turnIndex)
    expect(narrativeIndex).toBeGreaterThan(-1)
    expect(narrativeIndex).toBeGreaterThan(prefixIndex)
    expect(source).toContain("sessionPermissionRequest")
    expect(source).toContain("sessionQuestionRequest")
    expect(source).toContain("waitingForResponse")
    expect(source).toContain("waiting={active() && waitingForResponse()}")
    expect(source).toContain("userFacingAssistantOutput={true}")
  })
})
