import { describe, expect, test } from "bun:test"
import { isUploadCandidate, projectApiErrorMessage, resolveSyncAction, sha256Hex } from "./local-folder-sync"

describe("local folder sync helpers", () => {
  test("filters files that should not be uploaded", () => {
    expect(isUploadCandidate({ path: ".env", size: 10 })).toBe(false)
    expect(isUploadCandidate({ path: ".env.production", size: 10 })).toBe(false)
    expect(isUploadCandidate({ path: ".git/config", size: 10 })).toBe(false)
    expect(isUploadCandidate({ path: "node_modules/pkg/a.js", size: 10 })).toBe(false)
    expect(isUploadCandidate({ path: "src/a.ts", size: 10 })).toBe(true)
    expect(isUploadCandidate({ path: "src/large.ts", size: 11 * 1024 * 1024 })).toBe(false)
  })

  test("hashes content with sha256", async () => {
    expect(await sha256Hex("hello")).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824")
  })

  test("detects cloud-only changes and conflicts", () => {
    expect(
      resolveSyncAction({
        localHash: "a",
        previousLocalHash: "a",
        cloudHash: "b",
        previousCloudHash: "a",
      }),
    ).toBe("overwrite-local")
    expect(
      resolveSyncAction({
        localHash: "c",
        previousLocalHash: "a",
        cloudHash: "b",
        previousCloudHash: "a",
      }),
    ).toBe("conflict")
    expect(
      resolveSyncAction({
        localHash: "a",
        previousLocalHash: "a",
        cloudHash: "a",
        previousCloudHash: "a",
      }),
    ).toBe("unchanged")
  })

  test("explains missing project API in local frontend-only runs", () => {
    expect(projectApiErrorMessage(404)).toContain("/_zingpop/project")
  })
})
