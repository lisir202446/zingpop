import { describe, expect, test } from "bun:test"

describe("SessionTurn source", () => {
  test("renders assistantPrefix after the user message and before assistant parts", async () => {
    const source = await Bun.file(new URL("./session-turn.tsx", import.meta.url)).text()
    const propIndex = source.indexOf("assistantPrefix")
    const messageIndex = source.indexOf("<Message message={message()!}")
    const prefixIndex = source.indexOf("props.assistantPrefix")
    const assistantIndex = source.indexOf("<AssistantParts")

    expect(propIndex).toBeGreaterThan(-1)
    expect(messageIndex).toBeGreaterThan(-1)
    expect(prefixIndex).toBeGreaterThan(messageIndex)
    expect(assistantIndex).toBeGreaterThan(prefixIndex)
  })

  test("can show user-facing assistant output without raw tool parts", async () => {
    const source = await Bun.file(new URL("./session-turn.tsx", import.meta.url)).text()

    expect(source).toContain("userFacingAssistantOutput")
    expect(source).toContain("props.userFacingAssistantOutput")
  })

  test("uses strict final-answer filtering for user-facing assistant output", async () => {
    const source = await Bun.file(new URL("./message-part.tsx", import.meta.url)).text()

    expect(source).toContain("userFacingTextPartKeys")
    expect(source).not.toContain("afterTools.length > 0")
  })
})
