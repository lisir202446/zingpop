import { describe, expect, test } from "bun:test"

const routeFiles = [
  "index.ts",
  "empty.ts",
  "git.ts",
  "local.ts",
  "[id]/index.ts",
  "[id]/file.ts",
  "[id]/files.ts",
  "[id]/manifest.ts",
  "../preview/[id]/[...path].ts",
  "../preview-file/[id]/[...path].ts",
] as const

const expectedAuditEvents = [
  "workbench.project.list",
  "workbench.project.rename",
  "workbench.project.create.empty",
  "workbench.project.create.git",
  "workbench.project.create.local",
  "workbench.project.delete",
  "workbench.project.file.read",
  "workbench.project.files.upload",
  "workbench.project.manifest",
  "workbench.project.preview",
] as const

const mojibake = /闅愮|鏉℃|銆婇|涓|鍥藉|浣犵|鐢ㄦ|绗|鏂板缓|椤圭洰|鏈満/

describe("zingpop project routes", () => {
  test("do not ship garbled chinese defaults", async () => {
    for (const file of routeFiles) {
      expect(await Bun.file(new URL(`./${file}`, import.meta.url)).text()).not.toMatch(mojibake)
    }
  })

  test("audit sensitive project operations", async () => {
    const source = await Promise.all(routeFiles.map((file) => Bun.file(new URL(`./${file}`, import.meta.url)).text()))
      .then((files) => files.join("\n"))

    for (const event of expectedAuditEvents) {
      expect(source).toContain(event)
    }
  })
})
