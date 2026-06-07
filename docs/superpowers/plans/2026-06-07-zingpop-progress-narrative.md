# Zingpop Progress Narrative Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Codex-like progress narrative for each Zingpop turn while keeping raw tool records available behind a folded detail layer.

**Architecture:** Add a pure Zingpop utility that derives user-facing progress from existing messages, session status, and tool parts. Add a Solid component in `packages/app` that renders the narrative before `SessionTurn` and hides raw tool records by default through existing settings.

**Tech Stack:** SolidJS, Bun tests, `@opencode-ai/sdk/v2` message and part types, existing app message timeline.

---

### Task 1: Progress Narrative Utility

**Files:**
- Create: `packages/app/src/utils/session-progress-narrative.test.ts`
- Create: `packages/app/src/utils/session-progress-narrative.ts`

- [x] **Step 1: Write failing tests**

Add tests that construct real SDK-shaped messages and parts:

```ts
import { describe, expect, test } from "bun:test"
import type { Message, Part, SessionStatus } from "@opencode-ai/sdk/v2"
import { buildSessionProgressNarrative } from "./session-progress-narrative"

const user = { id: "user_1", role: "user", sessionID: "session_1", time: { created: 1000 } } as Message
const assistant = {
  id: "assistant_1",
  role: "assistant",
  sessionID: "session_1",
  parentID: "user_1",
  time: { created: 1100 },
} as Message

function tool(tool: string, status: "running" | "completed" | "error", input: Record<string, unknown> = {}): Part {
  return {
    id: `part_${tool}_${status}`,
    sessionID: "session_1",
    messageID: "assistant_1",
    type: "tool",
    callID: `call_${tool}`,
    tool,
    state:
      status === "completed"
        ? { status, input, output: "", title: tool, metadata: {}, time: { start: 1200, end: 1300 } }
        : status === "error"
          ? { status, input, error: "failed", metadata: {}, time: { start: 1200, end: 1300 } }
          : { status, input, metadata: {}, time: { start: 1200 } },
  } as Part
}

describe("session progress narrative", () => {
  test("starts with an understanding narrative when no tools have run", () => {
    expect(
      buildSessionProgressNarrative({
        messageID: "user_1",
        messages: [user],
        parts: {},
        status: { type: "busy" } as SessionStatus,
        now: 1500,
      }).phase,
    ).toBe("understanding")
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
    expect(narrative.lines[0]).toContain("遇到错误")
  })
})
```

- [x] **Step 2: Run tests and confirm failure**

Run: `cd packages/app && bun test --preload ./happydom.ts ./src/utils/session-progress-narrative.test.ts`

Expected: fail because `session-progress-narrative` does not exist.

- [x] **Step 3: Implement utility**

Create `buildSessionProgressNarrative` with:

- `assistantMessagesForProgress` fallback grouping.
- tool category mapping for context, edit, verification, planning, and waiting.
- phase selection that prioritizes error, running edit, running verification, running exploration, completion, then understanding.
- readable Chinese lines.
- counts and raw record count.

- [x] **Step 4: Re-run tests**

Run: `cd packages/app && bun test --preload ./happydom.ts ./src/utils/session-progress-narrative.test.ts`

Expected: pass.

### Task 2: Narrative Component and Timeline Integration

**Files:**
- Create: `packages/app/src/pages/session/session-progress-narrative.tsx`
- Create: `packages/app/src/pages/session/session-progress-narrative-source.test.ts`
- Modify: `packages/app/src/pages/session/message-timeline.tsx`

- [x] **Step 1: Write failing source test**

Add a source-level test that verifies `message-timeline.tsx` imports and renders the Zingpop progress narrative before `SessionTurn`.

- [x] **Step 2: Run source test and confirm failure**

Run: `cd packages/app && bun test --preload ./happydom.ts ./src/pages/session/session-progress-narrative-source.test.ts`

Expected: fail because the component is not wired yet.

- [x] **Step 3: Add component**

Render:

- a small status pill such as `正在处理 2m 18s` or `已处理 2m 18s`.
- one or two narrative lines.
- compact counts: `探索 N · 修改 N · 验证 N`.
- a folded detail hint: `详细执行记录 N 条，可展开查看原始工具输出`.

- [x] **Step 4: Wire timeline**

In `message-timeline.tsx`, compute the narrative with the same messageID, `sessionMessages()`, `sync.data.part`, `active() ? sessionStatus() : undefined`, and `Date.now()`. Render `SessionProgressNarrative` immediately before `SessionTurn`.

- [x] **Step 5: Re-run source test**

Run: `cd packages/app && bun test --preload ./happydom.ts ./src/pages/session/session-progress-narrative-source.test.ts`

Expected: pass.

### Task 3: Verification

**Files:**
- Verify only, no planned edits.

- [x] **Step 1: Run focused tests**

Run:

```bash
cd packages/app
bun test --preload ./happydom.ts ./src/utils/session-progress-narrative.test.ts ./src/pages/session/session-progress-narrative-source.test.ts
```

Expected: pass.

- [x] **Step 2: Run package typecheck**

Run: `cd packages/app && bun typecheck`

Expected: pass.

- [x] **Step 3: Inspect Git diff**

Run: `git diff --stat && git status --short`

Expected: only planned files plus existing untracked `.artifacts/`.

- [x] **Step 4: Commit**

Stage planned files only and commit:

```bash
git add docs/superpowers/plans/2026-06-07-zingpop-progress-narrative.md packages/app/src/utils/session-progress-narrative.ts packages/app/src/utils/session-progress-narrative.test.ts packages/app/src/pages/session/session-progress-narrative.tsx packages/app/src/pages/session/session-progress-narrative-source.test.ts packages/app/src/pages/session/message-timeline.tsx
git commit -m "Add Zingpop progress narrative"
```
