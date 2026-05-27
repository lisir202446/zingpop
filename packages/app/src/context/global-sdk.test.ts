import { describe, expect, test } from "bun:test"
import { base64Encode } from "@opencode-ai/shared/util/encode"
import { routeEventDirectory } from "./global-sdk"

describe("global sdk event routing", () => {
  test("uses the decoded route directory for global event streams", () => {
    const slug = base64Encode("/srv/zingpop/workspaces/wrk_1/projects/prj_1")

    expect(routeEventDirectory(`/${slug}/session/ses_123`)).toBe(
      "/srv/zingpop/workspaces/wrk_1/projects/prj_1",
    )
  })

  test("ignores missing or invalid route directories", () => {
    expect(routeEventDirectory(undefined)).toBeUndefined()
    expect(routeEventDirectory("/not-base64/session")).toBeUndefined()
  })
})
