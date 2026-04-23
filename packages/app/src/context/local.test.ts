import { describe, expect, test } from "bun:test"
import { pickDefaultModel } from "./local-model"

const provider = (id: string, models: string[]) => ({
  id,
  models: Object.fromEntries(models.map((modelID) => [modelID, { id: modelID }])),
})

describe("pickDefaultModel", () => {
  test("prefers popular connected providers over raw connection order", () => {
    expect(
      pickDefaultModel({
        connected: [
          provider("minimax", ["MiniMax-M2.7-highspeed"]),
          provider("opencode", ["big-pickle"]),
        ],
        defaults: {
          minimax: "MiniMax-M2.7-highspeed",
          opencode: "big-pickle",
        },
        valid: () => true,
      }),
    ).toEqual({
      providerID: "opencode",
      modelID: "big-pickle",
    })
  })
})
