import { describe, expect, test } from "bun:test"
import {
  listZingpopPreviewArtifacts,
  loadZingpopPreviewArtifacts,
  normalizePreviewArtifactPath,
  previewArtifactFromFileContent,
  previewArtifactFromPath,
  previewArtifactName,
  previewArtifactPanelState,
  previewArtifactPathForDirectory,
  previewArtifactPathForLatestTurn,
  previewArtifactPathForTurn,
  previewArtifactPathFromParts,
  previewTargetReadRetryDelay,
  previewArtifacts,
  selectPreviewArtifact,
  selectVisiblePreviewArtifact,
  shouldRefreshPreviewArtifacts,
  zingpopPreviewFileUrl,
  zingpopPreviewUrl,
} from "./zingpop-preview"

describe("zingpop preview utilities", () => {
  test("builds encoded preview URLs", () => {
    expect(zingpopPreviewUrl("project_1", "demo app/index.html")).toBe(
      "/_zingpop/preview/project_1/demo%20app/index.html",
    )
    expect(zingpopPreviewFileUrl("project_1", "demo app/index.html")).toBe(
      "/_zingpop/preview-file/project_1/demo%20app/index.html",
    )
  })

  test("normalizes generated html paths from Windows file tools", () => {
    expect(normalizePreviewArtifactPath(".\\nested\\parkour-game.html")).toBe("nested/parkour-game.html")
    expect(previewArtifactName("C:\\Users\\34682\\AppData\\Local\\Temp\\project\\parkour-game.html")).toBe(
      "parkour-game.html",
    )
    expect(
      previewArtifactPathForDirectory(
        "C:\\Users\\34682\\AppData\\Local\\Temp\\project\\parkour-game.html",
        "C:\\Users\\34682\\AppData\\Local\\Temp\\project",
      ),
    ).toBe("parkour-game.html")
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

  test("selects the html file written by the current assistant turn", () => {
    const artifacts = previewArtifacts("project_1", [
      { path: "snake.html", size: 1, sha256: "a", timeUpdated: 20 },
      { path: "parkour.html", size: 1, sha256: "b", timeUpdated: 10 },
    ])

    expect(selectPreviewArtifact(artifacts, "parkour.html")?.path).toBe("parkour.html")
    expect(selectPreviewArtifact(artifacts, "C:\\repo\\project\\parkour.html")?.path).toBe("parkour.html")
    expect(selectPreviewArtifact(artifacts, "missing.html", false)).toBeUndefined()
  })

  test("finds the latest generated html path from assistant tool parts", () => {
    expect(
      previewArtifactPathFromParts([
        {
          id: "part_1",
          sessionID: "session_1",
          messageID: "message_1",
          type: "tool",
          callID: "call_1",
          tool: "write",
          state: {
            status: "completed",
            input: { filePath: "snake.html" },
            output: "",
            title: "write",
            metadata: {},
            time: { start: 1, end: 2 },
          },
        },
        {
          id: "part_2",
          sessionID: "session_1",
          messageID: "message_1",
          type: "tool",
          callID: "call_2",
          tool: "write",
          state: {
            status: "completed",
            input: { filePath: "parkour.html" },
            output: "",
            title: "write",
            metadata: {},
            time: { start: 3, end: 4 },
          },
        },
      ]),
    ).toBe("parkour.html")
  })

  test("cleans generated html paths from noisy tool path fields", () => {
    expect(
      previewArtifactPathFromParts([
        {
          id: "part_1",
          sessionID: "session_1",
          messageID: "message_1",
          type: "tool",
          callID: "call_1",
          tool: "write",
          state: {
            status: "completed",
            input: { filePath: "/srv/zingpop/workspaces/wrk_1/study-plan.html /" },
            output: "",
            title: "write",
            metadata: {},
            time: { start: 1, end: 2 },
          },
        },
      ]),
    ).toBe("/srv/zingpop/workspaces/wrk_1/study-plan.html")
  })

  test("finds the generated html path from the assistant reply for the current turn", () => {
    expect(
      previewArtifactPathForTurn({
        messageID: "user_1",
        messages: [
          { id: "user_1", role: "user" },
          { id: "assistant_1", role: "assistant", parentID: "user_1" },
        ],
        parts: {
          user_1: [],
          assistant_1: [
            {
              id: "part_1",
              sessionID: "session_1",
              messageID: "assistant_1",
              type: "tool",
              callID: "call_1",
              tool: "write",
              state: {
                status: "completed",
                input: { filePath: "parkour.html" },
                output: "",
                title: "write",
                metadata: {},
                time: { start: 1, end: 2 },
              },
            },
          ],
        },
      }),
    ).toBe("parkour.html")
  })

  test("finds generated html from tool path aliases and assistant text fallback", () => {
    expect(
      previewArtifactPathForTurn({
        messageID: "user_1",
        messages: [
          { id: "user_1", role: "user" },
          { id: "assistant_1", role: "assistant", parentID: "user_1" },
        ],
        parts: {
          assistant_1: [
            {
              id: "part_1",
              sessionID: "session_1",
              messageID: "assistant_1",
              type: "tool",
              callID: "call_1",
              tool: "write",
              state: {
                status: "completed",
                input: { path: "study-plan.html" },
                output: "",
                title: "write",
                metadata: {},
                time: { start: 1, end: 2 },
              },
            },
            {
              id: "part_2",
              sessionID: "session_1",
              messageID: "assistant_1",
              type: "text",
              text: "从 Zingpop 预览面板打开 study-plan.html 即可查看。",
              time: { start: 3, end: 4 },
            },
          ],
        },
      }),
    ).toBe("study-plan.html")
  })

  test("finds generated html from assistant text with Chinese punctuation prefixes", () => {
    expect(
      previewArtifactPathFromParts([
        {
          id: "part_1",
          sessionID: "session_1",
          messageID: "assistant_1",
          type: "text",
          text: "文件已完成：study-plan.html，可以从预览面板打开。",
          time: { start: 1, end: 2 },
        },
      ]),
    ).toBe("study-plan.html")
  })

  test("keeps the final html target when intermediate assistant text appears before later edits", () => {
    expect(
      previewArtifactPathForTurn({
        messageID: "user_1",
        messages: [
          { id: "user_1", role: "user" },
          { id: "assistant_1", role: "assistant", parentID: "user_1" },
        ],
        parts: {
          assistant_1: [
            {
              id: "part_1",
              sessionID: "session_1",
              messageID: "assistant_1",
              type: "tool",
              callID: "call_1",
              tool: "write",
              state: {
                status: "completed",
                input: { path: "study-plan.html" },
                output: "",
                title: "write",
                metadata: {},
                time: { start: 1, end: 2 },
              },
            },
            {
              id: "part_2",
              sessionID: "session_1",
              messageID: "assistant_1",
              type: "text",
              text: "Now I need to add the remaining sections and JavaScript.",
              time: { start: 3, end: 4 },
            },
            {
              id: "part_3",
              sessionID: "session_1",
              messageID: "assistant_1",
              type: "tool",
              callID: "call_2",
              tool: "edit",
              state: {
                status: "completed",
                input: { filePath: "study-plan.html" },
                output: "",
                title: "edit",
                metadata: {},
                time: { start: 5, end: 6 },
              },
            },
            {
              id: "part_4",
              sessionID: "session_1",
              messageID: "assistant_1",
              type: "text",
              text: "文件已创建完毕。从 Zingpop 预览面板打开 study-plan.html 即可查看。",
              time: { start: 7, end: 8 },
            },
          ],
        },
      }),
    ).toBe("study-plan.html")
  })

  test("finds generated html from a bash fallback command", () => {
    expect(
      previewArtifactPathForTurn({
        messageID: "user_1",
        messages: [
          { id: "user_1", role: "user" },
          { id: "assistant_1", role: "assistant", parentID: "user_1" },
        ],
        parts: {
          assistant_1: [
            {
              id: "part_1",
              sessionID: "session_1",
              messageID: "assistant_1",
              type: "tool",
              callID: "call_1",
              tool: "bash",
              state: {
                status: "completed",
                input: { command: "cat > study-plan.html <<'EOF'\n<html></html>\nEOF" },
                output: "",
                title: "bash",
                metadata: {},
                time: { start: 1, end: 2 },
              },
            },
          ],
        },
      }),
    ).toBe("study-plan.html")
  })

  test("finds generated html from the following assistant when parent linkage is unavailable", () => {
    expect(
      previewArtifactPathForTurn({
        messageID: "user_2",
        messages: [
          { id: "user_1", role: "user" },
          { id: "assistant_1", role: "assistant" },
          { id: "user_2", role: "user" },
          { id: "assistant_2", role: "assistant" },
        ],
        parts: {
          assistant_1: [
            {
              id: "part_1",
              sessionID: "session_1",
              messageID: "assistant_1",
              type: "tool",
              callID: "call_1",
              tool: "write",
              state: {
                status: "completed",
                input: { filePath: "parkour.html" },
                output: "",
                title: "write",
                metadata: {},
                time: { start: 1, end: 2 },
              },
            },
          ],
          assistant_2: [
            {
              id: "part_2",
              sessionID: "session_1",
              messageID: "assistant_2",
              type: "tool",
              callID: "call_2",
              tool: "write",
              state: {
                status: "completed",
                input: { filePath: "shooting-game.html" },
                output: "",
                title: "write",
                metadata: {},
                time: { start: 3, end: 4 },
              },
            },
          ],
        },
      }),
    ).toBe("shooting-game.html")
  })

  test("finds the latest generated html path for the latest user turn", () => {
    expect(
      previewArtifactPathForLatestTurn({
        messages: [
          { id: "user_1", role: "user" },
          { id: "assistant_1", role: "assistant", parentID: "user_1" },
          { id: "user_2", role: "user" },
          { id: "assistant_2", role: "assistant", parentID: "user_2" },
        ],
        parts: {
          assistant_1: [
            {
              id: "part_1",
              sessionID: "session_1",
              messageID: "assistant_1",
              type: "tool",
              callID: "call_1",
              tool: "write",
              state: {
                status: "completed",
                input: { filePath: "snake.html" },
                output: "",
                title: "write",
                metadata: {},
                time: { start: 1, end: 2 },
              },
            },
          ],
          assistant_2: [
            {
              id: "part_2",
              sessionID: "session_1",
              messageID: "assistant_2",
              type: "tool",
              callID: "call_2",
              tool: "write",
              state: {
                status: "completed",
                input: { filePath: "parkour-game.html" },
                output: "",
                title: "write",
                metadata: {},
                time: { start: 3, end: 4 },
              },
            },
          ],
        },
      }),
    ).toBe("parkour-game.html")
  })

  test("builds an inline html preview artifact from file content", () => {
    expect(
      previewArtifactFromFileContent("nested\\parkour-game.html", {
        type: "text",
        content: "<!doctype html><canvas></canvas>",
      }),
    ).toMatchObject({
      path: "nested/parkour-game.html",
      name: "parkour-game.html",
      html: "<!doctype html><canvas></canvas>",
    })
  })

  test("builds an optimistic preview artifact from a known html target path", () => {
    expect(previewArtifactFromPath("project_1", "nested\\study-plan.html")).toMatchObject({
      path: "nested/study-plan.html",
      name: "study-plan.html",
      url: "/_zingpop/preview/project_1/nested/study-plan.html",
      fileUrl: "/_zingpop/preview-file/project_1/nested/study-plan.html",
    })
    expect(previewArtifactFromPath("project_1", "notes.txt")).toBeUndefined()
  })

  test("does not treat an empty early html read as a ready preview artifact", () => {
    expect(
      previewArtifactFromFileContent("study-plan.html", {
        type: "text",
        content: "",
      }),
    ).toBeUndefined()
  })

  test("does not choose a stale html artifact when the current turn path is unavailable", () => {
    const artifacts = previewArtifacts("project_1", [{ path: "index.html", size: 1, sha256: "a", timeUpdated: 1 }])

    expect(
      selectVisiblePreviewArtifact({
        artifacts,
        targetPath: undefined,
        manifestFallback: false,
      }),
    ).toBeUndefined()
  })

  test("does not show existing project html when the current turn did not write html", () => {
    const artifacts = previewArtifacts("project_1", [{ path: "parkour.html", size: 1, sha256: "a", timeUpdated: 1 }])

    expect(
      selectVisiblePreviewArtifact({
        artifacts,
        targetPath: undefined,
      }),
    ).toBeUndefined()
  })

  test("does not reuse a stale inline html artifact for a different target path", () => {
    expect(
      selectVisiblePreviewArtifact({
        artifacts: [],
        targetPath: "parkour.html",
        targetArtifact: previewArtifactFromFileContent("snake.html", {
          type: "text",
          content: "<!doctype html><canvas></canvas>",
        }),
      }),
    ).toBeUndefined()
  })

  test("uses the current turn inline artifact while the manifest still has older html files", () => {
    const current = previewArtifactFromFileContent("shooting-game.html", {
      type: "text",
      content: "<!doctype html><canvas id='game'></canvas>",
    })

    expect(current).toBeDefined()
    expect(
      selectVisiblePreviewArtifact({
        artifacts: previewArtifacts("project_1", [
          { path: "parkour.html", size: 1, sha256: "a", timeUpdated: 30 },
          { path: "snake.html", size: 1, sha256: "b", timeUpdated: 20 },
        ]),
        targetPath: "shooting-game.html",
        targetArtifact: current,
      })?.path,
    ).toBe("shooting-game.html")
  })

  test("shows a preview artifact before a manifest error", () => {
    const artifact = previewArtifactFromFileContent("parkour-game.html", {
      type: "text",
      content: "<!doctype html><canvas></canvas>",
    })
    expect(artifact).toBeDefined()

    expect(previewArtifactPanelState({ artifact, error: "Unable to load project files", loading: false })).toEqual({
      type: "preview",
      artifact: artifact!,
    })
  })

  test("loads manifest failures as panel state instead of throwing", async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = Object.assign(
      (() => Promise.resolve(new Response("missing", { status: 404 }))) as unknown as typeof fetch,
      { preconnect: originalFetch.preconnect },
    )

    try {
      await expect(loadZingpopPreviewArtifacts("missing")).resolves.toEqual({
        artifacts: [],
        error: "无法加载作品列表",
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test("loads preview artifacts through the lightweight html manifest", async () => {
    const originalFetch = globalThis.fetch
    let url = ""
    globalThis.fetch = Object.assign(
      ((input: RequestInfo | URL) => {
        url = String(input)
        return Promise.resolve(
          Response.json({
            files: [{ path: "index.html", size: 1, sha256: "", timeUpdated: 1 }],
          }),
        )
      }) as unknown as typeof fetch,
      { preconnect: originalFetch.preconnect },
    )

    try {
      expect(await listZingpopPreviewArtifacts("project_1")).toHaveLength(1)
      expect(url).toBe("/_zingpop/project/project_1/manifest?preview=html")
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test("refreshes only when a running session becomes idle", () => {
    expect(shouldRefreshPreviewArtifacts({ type: "busy" }, { type: "idle" })).toBe(true)
    expect(
      shouldRefreshPreviewArtifacts({ type: "retry", attempt: 1, message: "try again", next: 2 }, { type: "idle" }),
    ).toBe(true)
    expect(shouldRefreshPreviewArtifacts({ type: "idle" }, { type: "idle" })).toBe(false)
    expect(shouldRefreshPreviewArtifacts(undefined, { type: "idle" })).toBe(false)
    expect(shouldRefreshPreviewArtifacts({ type: "busy" }, { type: "busy" })).toBe(false)
  })

  test("retries direct target html reads while the file is not readable yet", () => {
    const artifact = previewArtifactFromFileContent("game.html", {
      type: "text",
      content: "<!doctype html><canvas></canvas>",
    })

    expect(
      previewTargetReadRetryDelay({
        targetPath: "game.html",
        targetArtifact: undefined,
        loading: false,
        attempt: 0,
      }),
    ).toBe(120)
    expect(
      previewTargetReadRetryDelay({
        targetPath: "game.html",
        targetArtifact: undefined,
        loading: true,
        attempt: 0,
      }),
    ).toBeUndefined()
    expect(
      previewTargetReadRetryDelay({
        targetPath: "game.html",
        targetArtifact: artifact,
        loading: false,
        attempt: 0,
      }),
    ).toBeUndefined()
    expect(
      previewTargetReadRetryDelay({
        targetPath: undefined,
        targetArtifact: undefined,
        loading: false,
        attempt: 0,
      }),
    ).toBeUndefined()
    expect(
      previewTargetReadRetryDelay({
        targetPath: "game.html",
        targetArtifact: undefined,
        loading: false,
        attempt: 6,
      }),
    ).toBe(3_000)
    expect(
      previewTargetReadRetryDelay({
        targetPath: "game.html",
        targetArtifact: undefined,
        loading: false,
        attempt: 8,
      }),
    ).toBeUndefined()
  })
})
