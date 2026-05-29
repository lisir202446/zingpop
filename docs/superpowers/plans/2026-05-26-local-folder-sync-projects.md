# Local Folder Sync Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the remote web path-entry project picker with Zingpop-owned projects that can be created from an arbitrary browser-selected local folder and synced back to that folder.

**Architecture:** Add a Zingpop project layer in `packages/console/core` and same-origin project APIs in `packages/console/app`; keep opencode operating on ordinary directories, but only on directories resolved from Zingpop project records. The web frontend uses the File System Access API for local folder handles, uploads a filtered cloud copy, and writes cloud changes back to the granted local folder.

**Tech Stack:** Bun, Solid Start route handlers, Drizzle MySQL schema, SolidJS frontend, browser File System Access API, IndexedDB, Nginx auth_request.

---

## File Structure

- Create `packages/console/core/src/schema/workbench_project.sql.ts`: Drizzle table for tenant-owned workbench projects.
- Create `packages/console/core/src/workbench-project.ts`: project creation, lookup, path validation, manifest, upload, git import, and opencode `Project.Info` mapping.
- Modify `packages/console/core/src/identifier.ts`: add `project: "prj"` prefix.
- Modify `packages/console/core/src/workbench.ts`: resolve access by authenticated account plus original request directory, and block experimental workspace routes.
- Create `packages/console/core/migrations/20260526090000_workbench_project/migration.sql`: database migration.
- Create `packages/console/core/test/workbench-project.test.ts`: backend unit coverage for path safety, mapping, and file manifest/upload helpers.
- Modify `packages/console/core/test/workbench-isolation.test.ts`: cover original URI project resolution and experimental workspace block.
- Create `packages/console/app/src/lib/zingpop-project-auth.ts`: shared session-to-workspace resolver for project APIs.
- Create route files under `packages/console/app/src/routes/zingpop/project/`: same-origin project list/create/upload/manifest/file/rename/delete endpoints.
- Modify `packages/console/app/src/routes/auth/status.ts`: pass the original URI into `Workbench.resolveAccess`.
- Modify `deploy/nginx/zingpop-app.conf`: proxy `/_zingpop/` to console app and block `/experimental/workspace`.
- Modify `packages/console/app/test/nginxWorkbenchIsolation.test.ts`: verify the new proxy and block.
- Create `packages/app/src/utils/zingpop-host.ts`: host/flag detection.
- Create `packages/app/src/utils/local-folder-sync.ts`: browser hashing, filtering, upload manifest, IndexedDB baseline, sync-back conflict detection.
- Create `packages/app/src/utils/local-folder-sync.test.ts`: pure tests for filtering and conflict behavior.
- Create `packages/app/src/components/dialog-zingpop-project.tsx`: Open local folder, Import Git repository, Create empty project UI.
- Modify `packages/app/src/pages/home.tsx`: use Zingpop project dialog on hosted workbench and display names instead of server paths.
- Modify `packages/app/src/pages/layout.tsx`: use Zingpop project dialog from sidebar and hide `/srv/...` in hosted sidebar subtitles.
- Modify `packages/app/src/context/global-sync/bootstrap.ts`: when hosted, load projects from `/_zingpop/project` rather than opencode global project list.

## Task 1: Backend Project Schema And Service

**Files:**
- Create: `packages/console/core/src/schema/workbench_project.sql.ts`
- Create: `packages/console/core/src/workbench-project.ts`
- Create: `packages/console/core/migrations/20260526090000_workbench_project/migration.sql`
- Modify: `packages/console/core/src/identifier.ts`
- Test: `packages/console/core/test/workbench-project.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, test } from "bun:test"
import { WorkbenchProject } from "../src/workbench-project"

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
  })

  test("filters excluded upload paths", () => {
    expect(WorkbenchProject.uploadAllowed({ path: "src/index.ts", size: 100 })).toBe(true)
    expect(WorkbenchProject.uploadAllowed({ path: ".git/config", size: 100 })).toBe(false)
    expect(WorkbenchProject.uploadAllowed({ path: "node_modules/pkg/index.js", size: 100 })).toBe(false)
    expect(WorkbenchProject.uploadAllowed({ path: ".env", size: 100 })).toBe(false)
    expect(WorkbenchProject.uploadAllowed({ path: "large.txt", size: 11 * 1024 * 1024 })).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd packages/console/core; bun test test/workbench-project.test.ts`

Expected: FAIL because `../src/workbench-project` does not exist.

- [ ] **Step 3: Add schema, migration, and minimal service**

Implement:

```ts
export namespace WorkbenchProject {
  export const SourceTypes = ["local_folder", "git_public", "empty"] as const
  export const SyncModes = ["manual", "auto"] as const
  export function directory(input: { workspaceID: string; projectID: string; env?: Record<string, string | undefined> }): string
  export function safeRelativePath(value: string): string
  export function uploadAllowed(input: { path: string; size: number }): boolean
}
```

The migration must create `workbench_project` with `workspace_id`, `id`, `name`, `source_type`, `source_label`, `directory`, `sync_mode`, and timestamp columns, with primary key `(workspace_id, id)` and unique key `(workspace_id, directory)`.

- [ ] **Step 4: Run tests to verify pass**

Run: `cd packages/console/core; bun test test/workbench-project.test.ts`

Expected: PASS.

## Task 2: Backend Project CRUD, Manifest, Upload, And Git Guards

**Files:**
- Modify: `packages/console/core/src/workbench-project.ts`
- Test: `packages/console/core/test/workbench-project.test.ts`

- [ ] **Step 1: Add failing filesystem and git validation tests**

Add tests for:

```ts
await WorkbenchProject.uploadFiles({
  directory,
  files: [{ path: "src/a.txt", contentBase64: Buffer.from("hello").toString("base64") }],
})
expect(await Bun.file(`${directory}/src/a.txt`).text()).toBe("hello")
expect(await WorkbenchProject.manifest({ directory })).toContainEqual(
  expect.objectContaining({ path: "src/a.txt", size: 5 }),
)
expect(() => WorkbenchProject.validateGitImport({ url: "http://github.com/a/b", branch: "" })).toThrow("HTTPS")
expect(() => WorkbenchProject.validateGitImport({ url: "https://u:p@github.com/a/b", branch: "" })).toThrow("credentials")
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd packages/console/core; bun test test/workbench-project.test.ts`

Expected: FAIL on missing methods.

- [ ] **Step 3: Implement upload, manifest, and validation**

Implement methods:

```ts
export type UploadFile = { path: string; contentBase64: string }
export type ManifestEntry = { path: string; size: number; sha256: string; timeUpdated: number }
export function validateGitImport(input: { url: string; branch?: string }): { url: string; branch?: string }
export async function uploadFiles(input: { directory: string; files: UploadFile[] }): Promise<void>
export async function manifest(input: { directory: string }): Promise<ManifestEntry[]>
```

Use Bun file APIs for reading and writing. Use a recursive directory walk that skips directories matching upload exclusions.

- [ ] **Step 4: Run tests to verify pass**

Run: `cd packages/console/core; bun test test/workbench-project.test.ts`

Expected: PASS.

## Task 3: Auth Resolution And Nginx Isolation

**Files:**
- Modify: `packages/console/core/src/workbench.ts`
- Modify: `packages/console/app/src/routes/auth/status.ts`
- Modify: `deploy/nginx/zingpop-app.conf`
- Modify: `packages/console/core/test/workbench-isolation.test.ts`
- Modify: `packages/console/app/test/nginxWorkbenchIsolation.test.ts`

- [ ] **Step 1: Write failing isolation tests**

Add assertions:

```ts
expect(Workbench.routeAllowed({ originalURI: "/experimental/workspace", method: "GET" })).toBe(false)
expect(Workbench.routeAllowed({ originalURI: "/experimental/workspace/abc", method: "POST" })).toBe(false)
```

For Nginx:

```ts
expect(config).toContain("location ^~ /_zingpop/")
expect(config).toContain("proxy_pass http://127.0.0.1:3000/zingpop/")
expect(config).toContain("location ~ ^/experimental/workspace(/|$)")
expect(config).toContain("return 403;")
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
cd packages/console/core
bun test test/workbench-isolation.test.ts
cd ../app
bun test test/nginxWorkbenchIsolation.test.ts
```

Expected: FAIL until route and Nginx rules are added.

- [ ] **Step 3: Implement auth and proxy changes**

Update `routeAllowed()` to block `/experimental/workspace`. Update `auth/status.ts`:

```ts
const access = await Workbench.resolveAccess({
  accountID: account.id,
  originalURI: input.request.headers.get("x-original-uri") ?? undefined,
})
```

Add Nginx `/_zingpop/` proxy to console app before `location /`, preserve cookies, and apply the experimental workspace block.

- [ ] **Step 4: Run tests to verify pass**

Run the same two test commands. Expected: PASS.

## Task 4: Same-Origin Zingpop Project API

**Files:**
- Create: `packages/console/app/src/lib/zingpop-project-auth.ts`
- Create: `packages/console/app/src/routes/zingpop/project/index.ts`
- Create: `packages/console/app/src/routes/zingpop/project/empty.ts`
- Create: `packages/console/app/src/routes/zingpop/project/local.ts`
- Create: `packages/console/app/src/routes/zingpop/project/git.ts`
- Create: `packages/console/app/src/routes/zingpop/project/[id]/files.ts`
- Create: `packages/console/app/src/routes/zingpop/project/[id]/manifest.ts`
- Create: `packages/console/app/src/routes/zingpop/project/[id]/file.ts`
- Create: `packages/console/app/src/routes/zingpop/project/[id]/index.ts`

- [ ] **Step 1: Write route-level smoke tests where practical**

Use direct helper tests for `requireWorkbenchAccess()` and backend service methods; route handlers should return JSON with `authenticated: false` on missing session and use service methods after auth.

- [ ] **Step 2: Implement shared auth helper**

```ts
export async function requireWorkbenchAccess(originalURI?: string) {
  const session = await useAuthSession()
  const current = session.data.current ? session.data.account?.[session.data.current] : undefined
  const account = current ?? Object.values(session.data.account ?? {})[0]
  if (!account) return
  return Workbench.resolveAccess({ accountID: account.id, originalURI })
}
```

- [ ] **Step 3: Implement API routes**

Return opencode-compatible project entries from list/create endpoints:

```ts
{
  id: project.id,
  worktree: project.directory,
  name: project.name,
  time: { created: project.timeCreated.getTime(), updated: project.timeUpdated.getTime() },
  sandboxes: []
}
```

`/files` accepts `{ files: [{ path, contentBase64 }] }`. `/file` requires a safe relative `path` query param.

- [ ] **Step 4: Typecheck console app**

Run: `cd packages/console/app; bun typecheck`

Expected: PASS.

## Task 5: Frontend Sync Utilities

**Files:**
- Create: `packages/app/src/utils/zingpop-host.ts`
- Create: `packages/app/src/utils/local-folder-sync.ts`
- Create: `packages/app/src/utils/local-folder-sync.test.ts`

- [ ] **Step 1: Write failing utility tests**

Test upload filtering and conflict decisions:

```ts
expect(isUploadCandidate({ path: ".env", size: 10 })).toBe(false)
expect(isUploadCandidate({ path: "node_modules/pkg/a.js", size: 10 })).toBe(false)
expect(isUploadCandidate({ path: "src/a.ts", size: 10 })).toBe(true)
expect(resolveSyncAction({ localHash: "a", previousLocalHash: "a", cloudHash: "b", previousCloudHash: "a" })).toBe("overwrite-local")
expect(resolveSyncAction({ localHash: "c", previousLocalHash: "a", cloudHash: "b", previousCloudHash: "a" })).toBe("conflict")
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd packages/app; bun test --preload ./happydom.ts ./src/utils/local-folder-sync.test.ts`

Expected: FAIL because the utility does not exist.

- [ ] **Step 3: Implement utilities**

Export:

```ts
export function isZingpopHostedWorkbench(): boolean
export function supportsLocalFolderPicker(): boolean
export function isUploadCandidate(input: { path: string; size: number }): boolean
export async function sha256Hex(input: Blob | string): Promise<string>
export function resolveSyncAction(input: SyncDecisionInput): "unchanged" | "overwrite-local" | "conflict" | "cloud-deleted"
```

Use IndexedDB only in UI-facing functions, not in pure test helpers.

- [ ] **Step 4: Run tests to verify pass**

Run: `cd packages/app; bun test --preload ./happydom.ts ./src/utils/local-folder-sync.test.ts`

Expected: PASS.

## Task 6: Zingpop Project Dialog And Hosted Workbench UI

**Files:**
- Create: `packages/app/src/components/dialog-zingpop-project.tsx`
- Modify: `packages/app/src/pages/home.tsx`
- Modify: `packages/app/src/pages/layout.tsx`
- Modify: `packages/app/src/context/global-sync/bootstrap.ts`

- [ ] **Step 1: Add the hosted project loader**

In `bootstrapGlobal`, when `isZingpopHostedWorkbench()` is true, fetch `/_zingpop/project` and set `globalStore.project` from `data.projects`.

- [ ] **Step 2: Add dialog UI**

The dialog must show three primary actions:

```tsx
<Button icon="folder-add-left">打开本机文件夹</Button>
<Button icon="git">从 Git 仓库导入</Button>
<Button icon="plus-small">新建空项目</Button>
```

The local action calls `window.showDirectoryPicker({ mode: "readwrite" })`, uploads filtered files to `/_zingpop/project/local` and `/_zingpop/project/:id/files`, then returns the created cloud directory to the caller.

- [ ] **Step 3: Replace hosted path-entry picker**

In `home.tsx` and `layout.tsx`, branch before `DialogSelectDirectory`:

```tsx
if (isZingpopHostedWorkbench()) {
  dialog.show(() => <DialogZingpopProject onSelect={resolve} />, () => resolve(null))
  return
}
```

- [ ] **Step 4: Hide server paths in hosted UI**

Show `project.name || getFilename(project.worktree)` in recent-project buttons and sidebar subtitle when hosted. Keep raw path tooltips for non-hosted opencode use.

- [ ] **Step 5: Typecheck app**

Run: `cd packages/app; bun typecheck`

Expected: PASS.

## Task 7: Verification And Rollout Notes

**Files:**
- Modify: `docs/commercialization-readiness.md`

- [ ] **Step 1: Run focused checks**

Run:

```bash
cd packages/console/core
bun test test/workbench-project.test.ts test/workbench-isolation.test.ts
bun typecheck
cd ../app
bun test test/nginxWorkbenchIsolation.test.ts
bun typecheck
cd ../../app
bun test --preload ./happydom.ts ./src/utils/local-folder-sync.test.ts
bun typecheck
```

Expected: all pass.

- [ ] **Step 2: Update readiness checklist**

Mark the project-productization item as partially complete with exact remaining browser QA:

```md
- [x] Zingpop project table, cloud directory isolation, auth-gated project resolution, `/_zingpop/` API, and hosted local-folder picker are implemented.
- [ ] Production browser QA remains: Chrome/Edge native folder picker, upload, cloud edit, sync back, conflict handling, two-account isolation probe.
```

