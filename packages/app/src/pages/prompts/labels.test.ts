import { describe, expect, test } from "bun:test"
import { promptTemplates } from "./data"
import { promptModeLabel, promptTemplateSummary, promptTypeLabel } from "./labels"

describe("prompt template labels", () => {
  test("localizes filter labels outside the prompt preview", () => {
    expect(promptModeLabel("All")).toBe("全部")
    expect(promptModeLabel("Light")).toBe("浅色")
    expect(promptModeLabel("Dark")).toBe("深色")
    expect(promptTypeLabel("All")).toBe("全部")
    expect(promptTypeLabel("Sans")).toBe("无衬线")
    expect(promptTypeLabel("Serif")).toBe("衬线")
    expect(promptTypeLabel("Mono")).toBe("等宽")
  })

  test("uses a Chinese summary for template chrome", () => {
    const template = promptTemplates.find((item) => item.id === "minimalist-monochrome")

    expect(template).toBeDefined()
    expect(promptTemplateSummary(template!)).toBe("纯黑白的编辑型设计系统，没有强调色、圆角和阴影。")
  })

  test("keeps the original summary as a fallback for unknown templates", () => {
    expect(
      promptTemplateSummary({
        id: "unknown",
        name: "Unknown",
        shortName: "Unknown",
        mode: "Light",
        type: "Sans",
        summary: "Fallback summary",
        prompt: "",
        index: "00",
        swatch: "modern",
      }),
    ).toBe("Fallback summary")
  })
})
