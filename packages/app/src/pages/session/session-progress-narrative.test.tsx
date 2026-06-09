import { describe, expect, test } from "bun:test"

describe("SessionProgressNarrative", () => {
  test("keeps narrative chrome and limits timer work to active turns", async () => {
    const source = await Bun.file(new URL("./session-progress-narrative.tsx", import.meta.url)).text()

    expect(source).toContain('data-component="session-progress-narrative"')
    expect(source).toContain("break-words")
    expect(source).toContain("正在处理")
    expect(source).toContain("详细执行记录")
    expect(source).toContain('props.status?.type !== "busy" && props.status?.type !== "retry"')
    expect(source).toContain("!props.waiting")
    expect(source).toContain("waiting: props.waiting")
    expect(source).toContain('countLabel("探索"')
    expect(source).toContain('countLabel("修改"')
    expect(source).toContain('countLabel("验证"')
    expect(source).toContain('data-slot="session-progress-narrative-events"')
    expect(source).toContain('data-slot="session-progress-narrative-event"')
    expect(source).toContain("已运行")
  })
})
