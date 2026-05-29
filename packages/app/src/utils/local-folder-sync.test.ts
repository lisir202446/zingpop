import { describe, expect, test } from "bun:test"
import { isUploadCandidate, projectApiErrorMessage, resolveSyncAction, sha256Hex, upsertZingpopProject } from "./local-folder-sync"

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

  test("upserts newly created hosted projects by id and worktree", () => {
    const first = {
      id: "prj_1",
      worktree: "/srv/zingpop/workspaces/wrk/projects/default",
      sandboxes: [],
      time: { created: 1, updated: 1 },
    }
    const renamed = { ...first, worktree: `${first.worktree}/`, name: "renamed", time: { created: 1, updated: 2 } }
    const second = {
      id: "prj_2",
      worktree: "/srv/zingpop/workspaces/wrk/projects/second",
      sandboxes: [],
      time: { created: 2, updated: 2 },
    }

    expect(upsertZingpopProject([first, second], renamed)).toEqual([renamed, second])
  })
})
