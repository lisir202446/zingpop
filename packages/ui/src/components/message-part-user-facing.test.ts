import { describe, expect, test } from "bun:test"
import type { Part as PartType } from "@opencode-ai/sdk/v2"
import { userFacingTextPartKeys } from "./message-part-user-facing"

function text(id: string, value: string) {
  return { id, type: "text", text: value } as PartType
}

function tool(id: string) {
  return {
    id,
    type: "tool",
    tool: "write",
    state: { status: "completed", input: {}, output: "", title: "write", metadata: {}, time: {} },
  } as PartType
}

function keys(parts: PartType[]) {
  return userFacingTextPartKeys(parts.map((part) => ({ messageID: "assistant_1", part })))
}

describe("user-facing assistant text filtering", () => {
  test("keeps the final plain assistant answer when no tools ran", () => {
    expect(keys([text("intro", "我先看一下"), text("final", "可以，已经完成。")])).toEqual(
      new Set(["assistant_1:final"]),
    )
  })

  test("keeps only text after the last tool for generated work", () => {
    expect(
      keys([
        text("process_1", "Now I need to add the remaining sections."),
        tool("write_1"),
        text("process_2", "Let me insert the final JavaScript."),
        tool("edit_1"),
        text("final", "文件已创建完毕，可以从预览面板打开 study-plan.html。"),
      ]),
    ).toEqual(new Set(["assistant_1:final"]))
  })

  test("hides intermediate process text when no final answer followed the last tool", () => {
    expect(
      keys([
        text("process_1", "Let me write this file in chunks."),
        tool("write_1"),
        text("process_2", "The file is too large for a single write."),
        tool("bash_1"),
      ]),
    ).toEqual(new Set())
  })
})
