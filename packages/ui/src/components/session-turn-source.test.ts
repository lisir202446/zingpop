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
    expect(source).toContain("userFacingTextPartIDs()?.size")
    expect(source).toContain("userFacingOnly={props.userFacingAssistantOutput}")
  })

  test("shows filtered user-facing assistant progress while the turn is still working", async () => {
    const source = await Bun.file(new URL("./session-turn.tsx", import.meta.url)).text()
    const showAssistantStart = source.indexOf("const showAssistantParts")
    const showAssistantSource = source.slice(showAssistantStart, source.indexOf("const showRawDetailsToggle"))

    expect(showAssistantStart).toBeGreaterThan(-1)
    expect(showAssistantSource).not.toContain("if (working()) return false")
    expect(showAssistantSource).toContain("userFacingTextPartIDs()?.size")
  })

  test("does not mark live user-facing progress as aria-hidden", async () => {
    const source = await Bun.file(new URL("./session-turn.tsx", import.meta.url)).text()

    expect(source).toContain("aria-hidden={props.userFacingAssistantOutput ? false : working()}")
    expect(source).not.toContain("aria-hidden={working()}")
  })

  test("lets the Zingpop narrative replace the generic thinking shimmer", async () => {
    const source = await Bun.file(new URL("./session-turn.tsx", import.meta.url)).text()
    const showThinkingStart = source.indexOf("const showThinking")
    const showThinkingSource = source.slice(showThinkingStart, source.indexOf("const showAssistantParts"))

    expect(showThinkingStart).toBeGreaterThan(-1)
    expect(showThinkingSource).toContain("if (props.userFacingAssistantOutput) return false")
    expect(source.indexOf("props.assistantPrefix")).toBeLessThan(source.indexOf('data-slot="session-turn-thinking"'))
  })

  test("keeps raw execution details collapsed in user-facing mode", async () => {
    const source = await Bun.file(new URL("./session-turn.tsx", import.meta.url)).text()

    expect(source).toContain('data-slot="session-turn-raw-details-toggle"')
    expect(source).toContain('data-slot="session-turn-raw-details-content"')
    expect(source).toContain("if (props.userFacingAssistantOutput) return state.rawDetails")
    expect(source).toContain("showDiffs()")
  })

  test("uses readable progress filtering for user-facing assistant output", async () => {
    const source = await Bun.file(new URL("./message-part.tsx", import.meta.url)).text()
    const filterSource = await Bun.file(new URL("./message-part-user-facing.ts", import.meta.url)).text()

    expect(source).toContain("userFacingTextPartKeys")
    expect(source).not.toContain("afterTools.length > 0")
    expect(filterSource).toContain("const hasTools = items.some")
    expect(filterSource).not.toContain("findLastIndex")
  })
})
