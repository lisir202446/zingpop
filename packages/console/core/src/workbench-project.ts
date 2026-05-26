import { createHash } from "node:crypto"
import { mkdir, readdir, rm, stat } from "node:fs/promises"
import { dirname, join as fsJoin, relative as fsRelative, resolve as fsResolve } from "node:path"
import { posix as path } from "node:path"
import { and, Database, eq, isNull, sql } from "./drizzle"
import { Identifier } from "./identifier"
import { WorkbenchProjectSourceType, WorkbenchProjectTable } from "./schema/workbench_project.sql"
import { UserTable } from "./schema/user.sql"

export namespace WorkbenchProject {
  export type SourceType = (typeof WorkbenchProjectSourceType)[number]
  export type UploadFile = { path: string; contentBase64: string }
  export type ManifestEntry = { path: string; size: number; sha256: string; timeUpdated: number }
  export type ProjectRecord = typeof WorkbenchProjectTable.$inferSelect

  export const MAX_FILE_SIZE = 10 * 1024 * 1024
  export const MAX_FILE_COUNT = 2_000
  export const MAX_TOTAL_SIZE = 200 * 1024 * 1024

  const safeSegment = /^[A-Za-z0-9_-]+$/
  const excludedDirectories = new Set([".git", "node_modules", "dist", "build", ".next", ".turbo", ".cache"])
  const allowedGitHosts = new Set(["github.com", "gitlab.com", "bitbucket.org", "gitee.com"])

  export function root(env: Record<string, string | undefined> = process.env) {
    return path.resolve((env.ZINGPOP_WORKSPACE_ROOT ?? "/srv/zingpop/workspaces").replace(/\/+$/, ""))
  }

  function assertSafeSegment(kind: "workspace" | "project", value: string) {
    if (!safeSegment.test(value)) throw new Error(`Unsafe ${kind} id`)
  }

  function assertInsideRoot(input: { root: string; directory: string }) {
    const relative = path.relative(path.resolve(input.root), path.resolve(input.directory))
    if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Workbench project directory must stay inside workspace root")
    }
  }

  export function directory(input: { workspaceID: string; projectID: string; env?: Record<string, string | undefined> }) {
    assertSafeSegment("workspace", input.workspaceID)
    assertSafeSegment("project", input.projectID)

    const base = root(input.env)
    const result = path.resolve(base, input.workspaceID, "projects", input.projectID)
    assertInsideRoot({ root: base, directory: result })
    return result
  }

  export function safeRelativePath(value: string) {
    if (!value || value.includes("\u0000") || value.includes("\\") || /^[A-Za-z]:/.test(value)) {
      throw new Error("Unsafe project file path")
    }

    const normalized = path.normalize(value)
    if (normalized === "." || normalized.startsWith("../") || normalized === ".." || path.isAbsolute(normalized)) {
      throw new Error("Unsafe project file path")
    }
    return normalized
  }

  function resolveFile(input: { directory: string; relative: string }) {
    const base = fsResolve(input.directory)
    const target = fsResolve(base, safeRelativePath(input.relative))
    const relative = fsRelative(base, target)
    if (relative.startsWith("..") || fsResolve(relative) === relative) throw new Error("Unsafe project file path")
    return target
  }

  export function uploadAllowed(input: { path: string; size: number }) {
    if (input.size > MAX_FILE_SIZE) return false
    const relative = (() => {
      try {
        return safeRelativePath(input.path)
      } catch {
        return
      }
    })()
    if (!relative) return false
    const parts = relative.split("/")
    if (parts.some((part) => excludedDirectories.has(part))) return false
    const filename = parts[parts.length - 1] ?? ""
    if (filename === ".env" || filename.startsWith(".env.")) return false
    return true
  }

  export function validateGitImport(input: { url: string; branch?: string }) {
    const url = new URL(input.url)
    if (url.protocol !== "https:") throw new Error("Git import requires HTTPS URLs")
    if (url.username || url.password) throw new Error("Git import URL must not include credentials")
    if (!allowedGitHosts.has(url.hostname)) throw new Error("Git import host is not in the allowlist")
    if (input.branch && !/^[A-Za-z0-9._/-]+$/.test(input.branch)) throw new Error("Unsafe git branch")
    if (input.branch?.includes("..") || input.branch?.startsWith("/") || input.branch?.endsWith("/")) {
      throw new Error("Unsafe git branch")
    }
    return {
      url: url.toString(),
      branch: input.branch || undefined,
    }
  }

  export function opencodeProject(project: ProjectRecord) {
    return {
      id: project.id,
      worktree: project.directory,
      name: project.name,
      time: {
        created: project.timeCreated.getTime(),
        updated: project.timeUpdated.getTime(),
      },
      sandboxes: [] as string[],
    }
  }

  export async function workspaceIDForAccount(accountID: string) {
    return Database.use((tx) =>
      tx
        .select({ workspace_id: UserTable.workspaceID })
        .from(UserTable)
        .where(and(eq(UserTable.accountID, accountID), isNull(UserTable.timeDeleted)))
        .limit(1)
        .then((rows) => rows[0]?.workspace_id),
    )
  }

  export async function list(input: { workspaceID: string }) {
    return Database.use((tx) =>
      tx
        .select()
        .from(WorkbenchProjectTable)
        .where(and(eq(WorkbenchProjectTable.workspace_id, input.workspaceID), isNull(WorkbenchProjectTable.timeDeleted)))
        .orderBy(WorkbenchProjectTable.timeUpdated),
    )
  }

  export async function get(input: { workspaceID: string; projectID: string }) {
    return Database.use((tx) =>
      tx
        .select()
        .from(WorkbenchProjectTable)
        .where(
          and(
            eq(WorkbenchProjectTable.workspace_id, input.workspaceID),
            eq(WorkbenchProjectTable.id, input.projectID),
            isNull(WorkbenchProjectTable.timeDeleted),
          ),
        )
        .limit(1)
        .then((rows) => rows[0]),
    )
  }

  export async function getByDirectory(input: { workspaceID: string; directory: string }) {
    return Database.use((tx) =>
      tx
        .select()
        .from(WorkbenchProjectTable)
        .where(
          and(
            eq(WorkbenchProjectTable.workspace_id, input.workspaceID),
            eq(WorkbenchProjectTable.directory, input.directory),
            isNull(WorkbenchProjectTable.timeDeleted),
          ),
        )
        .limit(1)
        .then((rows) => rows[0]),
    )
  }

  export async function create(input: {
    workspaceID: string
    name: string
    sourceType: SourceType
    sourceLabel: string
    syncMode?: "manual" | "auto"
    projectID?: string
    env?: Record<string, string | undefined>
  }) {
    const id = input.projectID ?? Identifier.create("project")
    const dir = directory({ workspaceID: input.workspaceID, projectID: id, env: input.env })
    await mkdir(dir, { recursive: true })
    await Database.use((tx) =>
      tx.insert(WorkbenchProjectTable).values({
        workspace_id: input.workspaceID,
        id,
        name: input.name,
        source_type: input.sourceType,
        source_label: input.sourceLabel,
        directory: dir,
        sync_mode: input.syncMode ?? "manual",
      }),
    )
    return (await get({ workspaceID: input.workspaceID, projectID: id }))!
  }

  export async function cloneGit(input: {
    directory: string
    url: string
    branch?: string
    env?: Record<string, string | undefined>
  }) {
    const git = validateGitImport({ url: input.url, branch: input.branch })
    await rm(input.directory, { recursive: true, force: true })
    const timeout = Number(input.env?.ZINGPOP_GIT_IMPORT_TIMEOUT_MS ?? process.env.ZINGPOP_GIT_IMPORT_TIMEOUT_MS ?? 60_000)
    const proc = Bun.spawn(
      [
        "git",
        "clone",
        "--depth",
        "1",
        ...(git.branch ? ["--branch", git.branch] : []),
        git.url,
        input.directory,
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    )
    const timer = setTimeout(() => proc.kill(), timeout)
    const code = await proc.exited.finally(() => clearTimeout(timer))
    if (code === 0) return
    throw new Error((await new Response(proc.stderr).text()) || "Git import failed")
  }

  export async function ensureDefault(input: { workspaceID: string; projectID: string; env?: Record<string, string | undefined> }) {
    const existing = await get({ workspaceID: input.workspaceID, projectID: input.projectID })
    if (existing) return existing
    return create({
      workspaceID: input.workspaceID,
      projectID: input.projectID,
      name: "default",
      sourceType: "empty",
      sourceLabel: "default",
      env: input.env,
    })
  }

  function projectFromOriginalURI(value: string | undefined) {
    if (!value) return
    return new URL(value, "https://app.zingpop.local").searchParams.get("directory") ?? undefined
  }

  export async function resolveForAccount(input: {
    accountID: string
    defaultProjectID: string
    originalURI?: string
    env?: Record<string, string | undefined>
  }) {
    const workspaceID = await workspaceIDForAccount(input.accountID)
    if (!workspaceID) return
    const requested = projectFromOriginalURI(input.originalURI)
    if (requested) return (await getByDirectory({ workspaceID, directory: requested })) ?? null
    return ensureDefault({ workspaceID, projectID: input.defaultProjectID, env: input.env })
  }

  export async function rename(input: { workspaceID: string; projectID: string; name: string }) {
    await Database.use((tx) =>
      tx
        .update(WorkbenchProjectTable)
        .set({ name: input.name })
        .where(and(eq(WorkbenchProjectTable.workspace_id, input.workspaceID), eq(WorkbenchProjectTable.id, input.projectID))),
    )
  }

  export async function remove(input: { workspaceID: string; projectID: string }) {
    await Database.use((tx) =>
      tx
        .update(WorkbenchProjectTable)
        .set({ timeDeleted: sql`now()` })
        .where(and(eq(WorkbenchProjectTable.workspace_id, input.workspaceID), eq(WorkbenchProjectTable.id, input.projectID))),
    )
  }

  export async function uploadFiles(input: { directory: string; files: UploadFile[] }) {
    const total = input.files.reduce((sum, file) => sum + Buffer.byteLength(file.contentBase64, "base64"), 0)
    if (input.files.length > MAX_FILE_COUNT) throw new Error("Project upload file count limit exceeded")
    if (total > MAX_TOTAL_SIZE) throw new Error("Project upload size limit exceeded")

    await Promise.all(
      input.files.map(async (file) => {
        const content = Buffer.from(file.contentBase64, "base64")
        if (!uploadAllowed({ path: file.path, size: content.byteLength })) return
        const target = resolveFile({ directory: input.directory, relative: file.path })
        await mkdir(dirname(target), { recursive: true })
        await Bun.write(target, content)
      }),
    )
  }

  async function walk(input: { directory: string; base: string }): Promise<ManifestEntry[]> {
    const entries = await readdir(input.directory, { withFileTypes: true }).catch(() => [])
    return (
      await Promise.all(
        entries.map(async (entry): Promise<ManifestEntry[]> => {
          const absolute = fsJoin(input.directory, entry.name)
          const relative = fsRelative(input.base, absolute).replaceAll("\\", "/")
          if (entry.isDirectory()) {
            if (excludedDirectories.has(entry.name)) return []
            return walk({ directory: absolute, base: input.base })
          }
          if (!entry.isFile()) return []

          const info = await stat(absolute)
          if (!uploadAllowed({ path: relative, size: info.size })) return []
          return [
            {
              path: safeRelativePath(relative),
              size: info.size,
              sha256: createHash("sha256").update(Buffer.from(await Bun.file(absolute).arrayBuffer())).digest("hex"),
              timeUpdated: info.mtimeMs,
            },
          ]
        }),
      )
    ).flat()
  }

  export async function manifest(input: { directory: string }) {
    return walk({ directory: fsResolve(input.directory), base: fsResolve(input.directory) }).then((entries) =>
      entries.sort((a, b) => a.path.localeCompare(b.path)),
    )
  }

  export async function readFile(input: { directory: string; path: string }) {
    return Bun.file(resolveFile({ directory: input.directory, relative: input.path }))
  }
}
