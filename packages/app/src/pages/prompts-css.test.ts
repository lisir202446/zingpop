import { describe, expect, test } from "bun:test"

const promptsCss = await Bun.file(new URL("./prompts.css", import.meta.url)).text()

function rule(selector: string) {
  const start = promptsCss.indexOf(`${selector} {`)
  expect(start).toBeGreaterThanOrEqual(0)
  return promptsCss.slice(start, promptsCss.indexOf("}", start))
}

describe("prompt templates preview layout", () => {
  test("lets the inline preview fill the remaining workbench area", () => {
    expect(rule(".prompt-content")).toContain("flex: 1;")
    expect(rule(".prompt-content")).toContain("grid-template-rows: minmax(0, 1fr) auto;")
    expect(rule(".prompt-content")).toContain("overflow: hidden;")
    expect(rule(".prompt-content")).toContain("align-content: stretch;")
    expect(rule(".prompt-preview-panel")).toContain("display: flex;")
    expect(rule(".prompt-preview-panel")).toContain("min-height: 0;")
    expect(rule(".prompt-preview-shell")).toContain("flex: 1;")
    expect(rule(".prompt-preview-shell")).toContain("height: 100%;")
    expect(rule(".prompt-preview-shell")).not.toContain("height: min(58vh, 560px);")
  })
})
