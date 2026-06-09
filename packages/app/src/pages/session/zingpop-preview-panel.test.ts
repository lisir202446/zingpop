import { describe, expect, test } from "bun:test"

describe("Zingpop preview panel source", () => {
  test("lets the composer dock fall back to the latest html manifest entry", async () => {
    const source = await Bun.file(new URL("./zingpop-preview-panel.tsx", import.meta.url)).text()
    const dockStart = source.indexOf("export function ZingpopPreviewDock")
    const dockSource = source.slice(dockStart, source.indexOf("function ZingpopPreviewPanelArtifact"))

    expect(dockSource).toContain("createZingpopPreviewArtifacts({ manifestFallback: true })")
    expect(dockSource).toContain("preview.pending()")
    expect(source).toContain("正在准备 HTML 预览")
  })

  test("shows a pending inline preview entry while the generated html is still loading", async () => {
    const source = await Bun.file(new URL("./zingpop-preview-panel.tsx", import.meta.url)).text()
    const inlineStart = source.indexOf("export function ZingpopPreviewInline")
    const inlineSource = source.slice(inlineStart, source.indexOf("function ZingpopPreviewDockPending"))

    expect(inlineSource).toContain("preview.pending()")
    expect(inlineSource).toContain("ZingpopPreviewDockPending")
  })
})
