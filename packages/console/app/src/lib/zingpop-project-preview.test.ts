import { describe, expect, test } from "bun:test"
import { withPreviewStorageShim } from "./zingpop-preview-html"

describe("zingpop project preview", () => {
  test("adds an in-memory storage shim before generated page scripts", () => {
    const html = withPreviewStorageShim(
      `<!doctype html><html><head><script>localStorage.setItem("score","1")</script></head></html>`,
    )

    expect(html).toContain("data-zingpop-preview-storage")
    expect(html.indexOf("data-zingpop-preview-storage")).toBeLessThan(html.indexOf('localStorage.setItem("score","1")'))
  })

  test("does not add duplicate storage shims", () => {
    const html = withPreviewStorageShim("<html><head></head><body></body></html>")

    expect(withPreviewStorageShim(html).match(/data-zingpop-preview-storage/g)?.length).toBe(1)
  })
})
