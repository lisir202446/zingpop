import { describe, expect, test } from "bun:test"

describe("SessionProgressNarrative", () => {
  test("keeps narrative chrome and limits timer work to active turns", async () => {
    const source = await Bun.file(new URL("./session-progress-narrative.tsx", import.meta.url)).text()

    expect(source).toContain('data-component="session-progress-narrative"')
    expect(source).toContain('aria-live={narrative().busy ? "polite" : "off"}')
    expect(source).toContain("aria-busy={narrative().busy}")
    expect(source).toContain("break-words")
    expect(source).toContain("正在处理")
    expect(source).toContain('props.status?.type !== "busy" && props.status?.type !== "retry"')
    expect(source).toContain("!props.waiting")
    expect(source).toContain("waiting: props.waiting")
    expect(source).not.toContain('data-slot="session-progress-narrative-counts"')
    expect(source).not.toContain('countLabel("探索"')
    expect(source).not.toContain('countLabel("修改"')
    expect(source).not.toContain('countLabel("验证"')
    expect(source).toContain('data-slot="session-progress-narrative-todo"')
    expect(source).toContain("已完成")
    expect(source).toContain("当前正在处理")
    expect(source).not.toContain("详细执行记录")
    expect(source).toContain('data-slot="session-progress-narrative-events"')
    expect(source).toContain('data-slot="session-progress-narrative-event"')
    expect(source).toContain("已运行")
  })

  test("uses a Codex-like collapsible progress capsule by default", async () => {
    const source = await Bun.file(new URL("./session-progress-narrative.tsx", import.meta.url)).text()

    expect(source).toContain('import { Collapsible } from "@opencode-ai/ui/collapsible"')
    expect(source).toContain("const [expanded, setExpanded] = createSignal(true)")
    expect(source).toContain("if (narrative().busy && !expanded()) setExpanded(true)")
    expect(source).toContain("<Collapsible open={expanded()} onOpenChange={setExpanded}")
    expect(source).toContain('data-slot="session-progress-narrative-trigger"')
    expect(source).toContain('aria-label={expanded() ? "收起处理过程" : "展开处理过程"}')
    expect(source).toContain('data-slot="session-progress-narrative-content"')
    expect(source).toContain("<Collapsible.Content")
    expect(source).toContain("共运行")
  })
})
