import { describe, expect, test } from "bun:test"
import {
  previewBrowserFrameSrc,
  withPreviewStorageShim,
  zingpopPreviewBrowserCardConfig,
} from "./zingpop-preview-browser-card"

describe("zingpop preview browser card", () => {
  test("uses embedded browser preview labels and direct actions", () => {
    expect(
      zingpopPreviewBrowserCardConfig({
        path: "snake.html",
        name: "snake.html",
        url: "/_zingpop/preview/project_1/snake.html",
        fileUrl: "/_zingpop/preview-file/project_1/snake.html",
        timeUpdated: 1,
      }),
    ).toEqual({
      title: "网页预览",
      openLabel: "新窗口打开",
      copyLabel: "复制链接",
      iframeSrc: "/_zingpop/preview-file/project_1/snake.html",
      openHref: "/_zingpop/preview/project_1/snake.html",
    })
  })

  test("uses runtime object URLs when the artifact was loaded from local file content", () => {
    const artifact = {
      path: "parkour-game.html",
      name: "parkour-game.html",
      url: "",
      fileUrl: "",
      html: "<!doctype html><canvas></canvas>",
      timeUpdated: 1,
    }

    expect(zingpopPreviewBrowserCardConfig(artifact)).toMatchObject({
      iframeSrc: "",
      openHref: "",
    })
    expect(previewBrowserFrameSrc(artifact, "blob:http://127.0.0.1/game")).toBe("blob:http://127.0.0.1/game")
  })

  test("adds an in-memory storage shim before generated page scripts", () => {
    const html = withPreviewStorageShim(
      `<!doctype html><html><head><script>localStorage.setItem("score","1")</script></head></html>`,
    )

    expect(html).toContain("data-zingpop-preview-storage")
    expect(html.indexOf("data-zingpop-preview-storage")).toBeLessThan(html.indexOf('localStorage.setItem("score","1")'))
  })
})
