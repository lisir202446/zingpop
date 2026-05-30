import { describe, expect, test } from "bun:test"
import { previewArtifacts, zingpopPreviewFileUrl, zingpopPreviewUrl } from "./zingpop-preview"

describe("zingpop preview utilities", () => {
  test("builds encoded preview URLs", () => {
    expect(zingpopPreviewUrl("project_1", "demo app/index.html")).toBe(
      "/_zingpop/preview/project_1/demo%20app/index.html",
    )
    expect(zingpopPreviewFileUrl("project_1", "demo app/index.html")).toBe(
      "/_zingpop/preview-file/project_1/demo%20app/index.html",
    )
  })

  test("keeps html artifacts sorted for users", () => {
    expect(
      previewArtifacts("project_1", [
        { path: "snake.py", size: 1, sha256: "a", timeUpdated: 3 },
        { path: "about.html", size: 1, sha256: "b", timeUpdated: 3 },
        { path: "index.html", size: 1, sha256: "c", timeUpdated: 1 },
        { path: "game.htm", size: 1, sha256: "d", timeUpdated: 4 },
      ]).map((item) => item.path),
    ).toEqual(["index.html", "game.htm", "about.html"])
  })
})
