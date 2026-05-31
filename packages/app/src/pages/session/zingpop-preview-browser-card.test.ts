import { describe, expect, test } from "bun:test"
import { zingpopPreviewBrowserCardConfig } from "./zingpop-preview-browser-card"

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
})
