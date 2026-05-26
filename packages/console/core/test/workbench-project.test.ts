import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "bun:test"
import { WorkbenchProject } from "../src/workbench-project"

const cleanup: string[] = []

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempProject() {
  const dir = await mkdtemp(join(tmpdir(), "zingpop-project-"))
  cleanup.push(dir)
  return dir
}

describe("workbench project helpers", () => {
  test("creates server-owned directories only under the configured root", () => {
    expect(
      WorkbenchProject.directory({
        workspaceID: "wrk_01",
        projectID: "prj_01",
        env: { ZINGPOP_WORKSPACE_ROOT: "/srv/zingpop/workspaces" },
      }),
    ).toBe("/srv/zingpop/workspaces/wrk_01/projects/prj_01")
    expect(() =>
      WorkbenchProject.directory({
        workspaceID: "../root",
        projectID: "prj_01",
        env: { ZINGPOP_WORKSPACE_ROOT: "/srv/zingpop/workspaces" },
      }),
    ).toThrow("Unsafe workspace id")
  })

  test("rejects unsafe relative file paths", () => {
    expect(WorkbenchProject.safeRelativePath("src/index.ts")).toBe("src/index.ts")
    expect(() => WorkbenchProject.safeRelativePath("../secret")).toThrow("Unsafe project file path")
    expect(() => WorkbenchProject.safeRelativePath("C:/secret")).toThrow("Unsafe project file path")
    expect(() => WorkbenchProject.safeRelativePath("a\u0000b")).toThrow("Unsafe project file path")
    expect(() => WorkbenchProject.safeRelativePath("src\\secret.ts")).toThrow("Unsafe project file path")
  })

  test("filters excluded upload paths", () => {
    expect(WorkbenchProject.uploadAllowed({ path: "src/index.ts", size: 100 })).toBe(true)
    expect(WorkbenchProject.uploadAllowed({ path: ".git/config", size: 100 })).toBe(false)
    expect(WorkbenchProject.uploadAllowed({ path: "node_modules/pkg/index.js", size: 100 })).toBe(false)
    expect(WorkbenchProject.uploadAllowed({ path: ".env", size: 100 })).toBe(false)
    expect(WorkbenchProject.uploadAllowed({ path: ".env.production", size: 100 })).toBe(false)
    expect(WorkbenchProject.uploadAllowed({ path: "large.txt", size: 11 * 1024 * 1024 })).toBe(false)
  })

  test("uploads files and returns stable manifests", async () => {
    const directory = await tempProject()

    await WorkbenchProject.uploadFiles({
      directory,
      files: [{ path: "src/a.txt", contentBase64: Buffer.from("hello").toString("base64") }],
    })

    expect(await Bun.file(join(directory, "src", "a.txt")).text()).toBe("hello")
    expect(await WorkbenchProject.manifest({ directory })).toContainEqual(
      expect.objectContaining({
        path: "src/a.txt",
        sha256: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
        size: 5,
      }),
    )
  })

  test("rejects unsafe git import inputs", () => {
    expect(() => WorkbenchProject.validateGitImport({ url: "http://github.com/a/b", branch: "" })).toThrow("HTTPS")
    expect(() => WorkbenchProject.validateGitImport({ url: "https://u:p@github.com/a/b", branch: "" })).toThrow(
      "credentials",
    )
    expect(() => WorkbenchProject.validateGitImport({ url: "https://evil.example/a/b", branch: "" })).toThrow(
      "allowlist",
    )
    expect(() => WorkbenchProject.validateGitImport({ url: "https://github.com/a/b", branch: "../main" })).toThrow(
      "branch",
    )
  })
})
