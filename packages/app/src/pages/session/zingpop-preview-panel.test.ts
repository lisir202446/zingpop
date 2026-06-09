import { describe, expect, test } from "bun:test"

describe("Zingpop preview panel source", () => {
  test("lets the composer dock fall back to the latest html manifest entry", async () => {
    const source = await Bun.file(new URL("./zingpop-preview-panel.tsx", import.meta.url)).text()
    const dockStart = source.indexOf("export function ZingpopPreviewDock")
    const dockSource = source.slice(dockStart, source.indexOf("function ZingpopPreviewPanelArtifact"))

    expect(dockSource).toContain("createZingpopPreviewArtifacts({ manifestFallback: true })")
  })
})
