import { describe, expect, test } from "bun:test"
import type { Message, Part, SessionStatus } from "@opencode-ai/sdk/v2"
import { buildSessionProgressNarrative } from "./session-progress-narrative"

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

const completedAssistant = {
  ...assistant,
  time: { created: 1100, completed: 1800 },
} as Message

function tool(
  tool: string,
  status: "running" | "completed" | "error",
  input: Record<string, unknown> = {},
  metadata: Record<string, unknown> = {},
): Part {
  return {
    id: `part_${tool}_${status}`,
    sessionID: "session_1",
    messageID: "assistant_1",
    type: "tool",
    callID: `call_${tool}`,
    tool,
    state:
      status === "completed"
        ? { status, input, output: "", title: tool, metadata, time: { start: 1200, end: 1300 } }
        : status === "error"
          ? { status, input, error: "failed", metadata, time: { start: 1200, end: 1300 } }
          : { status, input, metadata, time: { start: 1200 } },
  } as Part
}

describe("session progress narrative", () => {
  test("starts with an understanding narrative when no tools have run", () => {
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user],
      parts: {},
      status: { type: "busy" } as SessionStatus,
      now: 1500,
    })

    expect(narrative.phase).toBe("understanding")
    expect(narrative.lines[0]).toContain("正在理解")
    expect(narrative.events[0]?.text).toContain("正在理解")
    expect(narrative.events[0]?.detailCount).toBe(0)
  })

  test("summarizes exploration, editing, and verification tools", () => {
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user, assistant],
      parts: {
        assistant_1: [
          tool("read", "completed", { filePath: "shooting-game.html" }),
          tool("edit", "running", { filePath: "shooting-game.html" }),
          tool("bash", "completed", { command: "bun test ./src/utils/session-progress-narrative.test.ts" }),
        ],
      },
      status: { type: "busy" } as SessionStatus,
      now: 3000,
    })

    expect(narrative.phase).toBe("editing")
    expect(narrative.counts.exploring).toBe(1)
    expect(narrative.counts.editing).toBe(1)
    expect(narrative.counts.verifying).toBe(1)
    expect(narrative.lines.join("\n")).toContain("shooting-game.html")
  })

  test("prioritizes errors over normal progress", () => {
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user, assistant],
      parts: { assistant_1: [tool("bash", "error", { command: "bun typecheck" })] },
      status: { type: "idle" } as SessionStatus,
      now: 3000,
    })

    expect(narrative.phase).toBe("error")
    expect(narrative.lines[0]).toContain("底层限制")
  })

  test("prioritizes pending user confirmation over active tool progress", () => {
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user, assistant],
      parts: { assistant_1: [tool("bash", "running", { command: "bun typecheck" })] },
      status: { type: "busy" } as SessionStatus,
      waiting: true,
      now: 3000,
    })

    expect(narrative.phase).toBe("waiting")
    expect(narrative.busy).toBe(true)
    expect(narrative.counts.waiting).toBe(1)
    expect(narrative.counts.verifying).toBe(1)
  })

  test("shows waiting as active even when no tool parts have rendered yet", () => {
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user],
      parts: {},
      status: { type: "idle" } as SessionStatus,
      waiting: true,
      now: 3000,
    })

    expect(narrative.phase).toBe("waiting")
    expect(narrative.busy).toBe(true)
    expect(narrative.counts.waiting).toBe(1)
    expect(narrative.elapsedMs).toBe(2000)
  })

  test("shows complete after all tools finish and the session is idle", () => {
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user, assistant],
      parts: {
        assistant_1: [
          tool("edit", "completed", { filePath: "shooting-game.html" }),
          tool("bash", "completed", { command: "bun test ./src/utils/session-progress-narrative.test.ts" }),
        ],
      },
      status: { type: "idle" } as SessionStatus,
      now: 3000,
    })

    expect(narrative.phase).toBe("complete")
    expect(narrative.lines.join("\n")).toContain("更新")
    expect(narrative.lines.join("\n")).toContain("运行检查")
    expect(narrative.lines.join("\n")).not.toContain("详细执行记录")
  })
  test("uses current time only while the turn is active", () => {
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user, assistant],
      parts: { assistant_1: [tool("edit", "running", { filePath: "shooting-game.html" })] },
      status: { type: "busy" } as SessionStatus,
      now: 3000,
    })

    expect(narrative.elapsedMs).toBe(2000)
  })

  test("uses assistant completion time for historical completed turns", () => {
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user, completedAssistant],
      parts: { assistant_1: [tool("edit", "completed", { filePath: "shooting-game.html" })] },
      status: { type: "idle" } as SessionStatus,
      now: 600_000,
    })

    expect(narrative.elapsedMs).toBe(800)
  })

  test("keeps narrative lines free of raw shell commands", () => {
    const command = `bun test ${"very-long-segment".repeat(20)}`
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user, assistant],
      parts: { assistant_1: [tool("bash", "running", { command })] },
      status: { type: "busy" } as SessionStatus,
      now: 3000,
    })
    const line = narrative.lines.join("\n")

    expect(line.length).toBeLessThan(command.length)
    expect(line).not.toContain("bun test")
    expect(line).toContain("运行检查")
  })

  test("explains recoverable write formatting errors in user-facing language", () => {
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user, assistant],
      parts: {
        assistant_1: [
          tool("invalid", "error", {
            tool: "write",
            filePath: "study-plan.html",
            error: "Invalid input for tool write: JSON parsing failed",
          }),
          tool("bash", "running", { command: "cat > study-plan.html <<'EOF'" }),
        ],
      },
      status: { type: "busy" } as SessionStatus,
      now: 3000,
    })
    const text = narrative.lines.join("\n")

    expect(narrative.phase).not.toBe("error")
    expect(text).toContain("格式限制")
    expect(text).toContain("更稳定")
    expect(text).not.toContain("JSON parsing")
  })

  test("groups low-level tool parts into Codex-style progress paragraphs", () => {
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user, assistant],
      parts: {
        assistant_1: [
          tool("read", "completed", { filePath: "study-plan.html" }),
          tool("write", "completed", { path: "study-plan.html" }),
          tool("invalid", "error", {
            tool: "write",
            filePath: "study-plan.html",
            error: "Invalid input for tool write: JSON parsing failed",
          }),
          tool("bash", "running", { command: "cat > study-plan.html <<'EOF'" }),
          tool("bash", "completed", { command: "bun test ./src/utils/zingpop-preview.test.ts" }),
        ],
      },
      status: { type: "busy" } as SessionStatus,
      now: 4000,
    })
    const text = narrative.events.map((event) => event.text).join("\n")

    expect(narrative.events.length).toBeLessThan(5)
    expect(narrative.events.map((event) => event.detailCount)).toEqual([1, 2, 4, 5])
    expect(text).toContain("检查")
    expect(text).toContain("study-plan.html")
    expect(text).toContain("格式限制")
    expect(text).toContain("稳定")
    expect(text).toContain("运行检查")
    expect(text).not.toContain("cat >")
    expect(text).not.toContain("bun test")
    expect(text).not.toContain("JSON parsing")
  })

  test("treats shell file creation as an editing progress step", () => {
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user, assistant],
      parts: {
        assistant_1: [tool("bash", "completed", { command: "cat > study-plan.html <<'EOF'\n<html></html>\nEOF" })],
      },
      status: { type: "busy" } as SessionStatus,
      now: 4000,
    })

    expect(narrative.events[0]).toMatchObject({
      phase: "editing",
      detailCount: 1,
    })
    expect(narrative.events[0]?.text).toContain("study-plan.html")
  })

  test("summarizes the latest task list for user-facing progress", () => {
    const todos = [
      { content: "搭建页面结构", status: "completed", priority: "high" },
      { content: "补充交互逻辑", status: "in_progress", priority: "high" },
      { content: "验证预览入口", status: "pending", priority: "medium" },
    ]
    const narrative = buildSessionProgressNarrative({
      messageID: "user_1",
      messages: [user, assistant],
      parts: {
        assistant_1: [
          tool("todowrite", "completed", { todos }),
          tool("edit", "running", { filePath: "study-plan.html" }),
        ],
      },
      status: { type: "busy" } as SessionStatus,
      now: 4000,
    })

    expect(narrative.todo).toMatchObject({
      total: 3,
      done: 1,
      active: "补充交互逻辑",
    })
    expect(narrative.todo?.items.map((item) => item.content)).toEqual([
      "搭建页面结构",
      "补充交互逻辑",
      "验证预览入口",
    ])
  })
})
