import { describe, expect, test } from "bun:test"
import type { Message, Part, SessionStatus } from "@opencode-ai/sdk/v2"
import { buildSessionProgressNarrative } from "@/utils/session-progress-narrative"
import {
  previewArtifactFromPath,
  previewArtifactPathForDirectory,
  previewArtifactPathForTurn,
} from "@/utils/zingpop-preview"

const user = {
  id: "user_1",
  role: "user",
  sessionID: "session_1",
  time: { created: 1000 },
} as Message

const assistant = {
  id: "assistant_1",
  role: "assistant",
  sessionID: "session_1",
  parentID: "user_1",
  time: { created: 1100 },
} as Message

function text(id: string, value: string) {
  return {
    id,
    sessionID: "session_1",
    messageID: "assistant_1",
    type: "text",
    text: value,
  } as Part
}

function tool(
  id: string,
  toolName: string,
  status: "running" | "completed" | "error",
  input: Record<string, unknown>,
) {
  return {
    id,
    sessionID: "session_1",
    messageID: "assistant_1",
    type: "tool",
    callID: id,
    tool: toolName,
    state:
      status === "completed"
        ? { status, input, output: "", title: toolName, metadata: {}, time: { start: 1200, end: 1300 } }
        : status === "error"
          ? {
              status,
              input,
              error: "Invalid input for tool write: JSON parsing failed",
              metadata: {},
              time: { start: 1200, end: 1300 },
            }
          : { status, input, metadata: {}, time: { start: 1200 } },
  } as Part
}

describe("Zingpop user-facing session experience", () => {
  test("keeps Codex-style progress readable while preserving the generated html preview target", () => {
    const parts = [
      tool("read_1", "read", "completed", { filePath: "study-plan.html" }),
      text("process_1", "Now I need to add the remaining sections and JavaScript."),
      tool("invalid_1", "invalid", "error", {
        tool: "write",
        filePath: "/srv/zingpop/workspaces/wrk_1/study-plan.html",
        error: "Invalid input for tool write: JSON parsing failed",
      }),
      text(
        "raw_1",
        '调用了 `invalid` error=Invalid input for tool write: JSON parsing failed: Text: {"filePath":"/srv/zingpop/workspaces/wrk_1/study-plan.html"}',
      ),
      tool("bash_1", "bash", "running", { command: "cat > study-plan.html <<'EOF'" }),
      text("final_1", "学习计划表已创建完成，可以从预览面板打开 study-plan.html。"),
    ]

    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user, assistant],
      parts: { assistant_1: parts },
      status: { type: "busy" } as SessionStatus,
      now: 4000,
    })
    const narrativeText = narrative.events.map((event) => event.text).join("\n")

    expect(narrativeText).toContain("检查")
    expect(narrativeText).toContain("study-plan.html")
    expect(narrativeText).toContain("格式限制")
    expect(narrativeText).toContain("稳定")
    expect(narrativeText).not.toContain("JSON parsing")
    expect(narrativeText).not.toContain("filePath")
    expect(narrativeText).not.toContain("cat >")
    expect(narrativeText).not.toContain("调用了")

    const targetPath = previewArtifactPathForTurn({
      messageID: "user_1",
      messages: [user, assistant],
      parts: { assistant_1: parts },
    })
    const projectPath = previewArtifactPathForDirectory(targetPath ?? "", "/srv/zingpop/workspaces/wrk_1")
    const artifact = previewArtifactFromPath("project_1", projectPath)

    expect(projectPath).toBe("study-plan.html")
    expect(artifact).toMatchObject({
      name: "study-plan.html",
      url: "/_zingpop/preview/project_1/study-plan.html",
      fileUrl: "/_zingpop/preview-file/project_1/study-plan.html",
    })
  })
})
