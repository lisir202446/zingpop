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

  test("every workbench session turn uses the Zingpop user-facing progress path", async () => {
    const source = await Bun.file(new URL("./message-timeline.tsx", import.meta.url)).text()
    const turnBlocks = source.match(/<SessionTurn[\s\S]*?\/>/g) ?? []

    expect(turnBlocks.length).toBeGreaterThan(0)
    expect(turnBlocks).toHaveLength(1)
    expect(turnBlocks[0]).toContain("userFacingAssistantOutput={true}")
    expect(turnBlocks[0]).toContain("assistantPrefix={")
    expect(turnBlocks[0]).toContain("<SessionProgressNarrative")
    expect(turnBlocks[0]).toContain("waiting={active() && waitingForResponse()}")
  })

  test("message timeline shows an inline preview for every html-producing turn", async () => {
    const source = await Bun.file(new URL("./message-timeline.tsx", import.meta.url)).text()
    const previewStart = source.indexOf("<ZingpopPreviewInline")
    const localSource = source.slice(Math.max(0, previewStart - 160), previewStart + 160)

    expect(previewStart).toBeGreaterThan(-1)
    expect(localSource).toContain("<Show when={previewTargetPath()}>")
    expect(localSource).not.toContain("messageID === latestRenderedMessageID")
  })
})
