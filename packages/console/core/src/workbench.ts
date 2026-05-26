import { mkdir } from "node:fs/promises"
import { posix as path } from "node:path"
import { Database, and, eq, isNull } from "./drizzle/index"
import { UserTable } from "./schema/user.sql"
import { WorkbenchProject } from "./workbench-project"

export namespace Workbench {
  export type Access = {
    accountID?: string
    workspaceID: string
    projectID: string
    directory: string
  }

  const safeSegment = /^[A-Za-z0-9_-]+$/

  export function projectID(env: Record<string, string | undefined> = process.env) {
    return env.ZINGPOP_DEFAULT_PROJECT_ID?.trim() || "default"
  }

  export function root(env: Record<string, string | undefined> = process.env) {
    return path.resolve((env.ZINGPOP_WORKSPACE_ROOT ?? "/srv/zingpop/workspaces").replace(/\/+$/, ""))
  }

  export function assertSafeSegment(kind: "workspace" | "project", value: string) {
    if (!safeSegment.test(value)) throw new Error(`Unsafe ${kind} id`)
  }

  export function assertInsideRoot(input: { root: string; directory: string }) {
    const relative = path.relative(path.resolve(input.root), path.resolve(input.directory))
    if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Workbench directory must stay inside workspace root")
    }
  }

  export function directory(input: { workspaceID: string; projectID?: string; env?: Record<string, string | undefined> }) {
    const project = input.projectID ?? projectID(input.env)
    assertSafeSegment("workspace", input.workspaceID)
    assertSafeSegment("project", project)

    const base = root(input.env)
    const result = path.resolve(base, input.workspaceID, "projects", project)
    assertInsideRoot({ root: base, directory: result })
    return result
  }

  export async function resolveAccess(input: {
    accountID: string
    originalURI?: string
    env?: Record<string, string | undefined>
  }) {
    const project = await WorkbenchProject.resolveForAccount({
      accountID: input.accountID,
      defaultProjectID: projectID(input.env),
      originalURI: input.originalURI,
      env: input.env,
    })
    if (project === null) return
    if (project) {
      return {
        accountID: input.accountID,
        workspaceID: project.workspace_id,
        projectID: project.id,
        directory: project.directory,
      }
    }

    const user = await Database.use((tx) =>
      tx
        .select({
          workspaceID: UserTable.workspaceID,
        })
        .from(UserTable)
        .where(and(eq(UserTable.accountID, input.accountID), isNull(UserTable.timeDeleted)))
        .limit(1)
        .then((rows) => rows[0]),
    )
    if (!user) return

    const fallbackProject = projectID(input.env)
    return {
      accountID: input.accountID,
      workspaceID: user.workspaceID,
      projectID: fallbackProject,
      directory: directory({ workspaceID: user.workspaceID, projectID: fallbackProject, env: input.env }),
    }
  }

  export async function ensureDirectory(access: Pick<Access, "directory">) {
    await mkdir(access.directory, { recursive: true })
  }

  export function accessHeaders(access: Pick<Access, "workspaceID" | "projectID" | "directory">) {
    return {
      "X-Opencode-Directory": access.directory,
      "X-Opencode-Workspace": access.workspaceID,
      "X-Zingpop-Project-ID": access.projectID,
      "X-Zingpop-Workspace-ID": access.workspaceID,
    }
  }

  function originalURL(value: string | undefined) {
    if (!value) return
    return new URL(URL.canParse(value) ? value : value, "https://app.zingpop.local")
  }

  export function originalPath(value: string | undefined) {
    return originalURL(value)?.pathname
  }

  export function sessionIDFromOriginalURI(value: string | undefined) {
    const parts = originalPath(value)?.split("/").filter(Boolean)
    if (!parts || parts[0] !== "session") return
    if (parts[1] === "status") return
    return parts[1]
  }

  export function routeAllowed(input: { originalURI?: string; method?: string }) {
    const pathname = originalPath(input.originalURI)
    if (!pathname) return true
    if (pathname === "/global/dispose" || pathname === "/global/upgrade" || pathname === "/instance/dispose") return false
    if (pathname === "/experimental/workspace" || pathname.startsWith("/experimental/workspace/")) return false
    if (pathname === "/sync" || pathname.startsWith("/sync/")) return false
    if (pathname === "/tui" || pathname.startsWith("/tui/")) return false
    if (pathname === "/global/config" && input.method && input.method.toUpperCase() !== "GET") return false
    return true
  }

  export function sessionMatchesAccess(input: { session: { directory?: unknown; workspaceID?: unknown }; access: Access }) {
    if (input.session.directory !== input.access.directory) return false
    if (input.session.workspaceID && input.session.workspaceID !== input.access.workspaceID) return false
    return true
  }

  function opencodeOrigin(env: Record<string, string | undefined> = process.env) {
    return env.ZINGPOP_OPENCODE_ORIGIN ?? `http://127.0.0.1:${env.ZINGPOP_PORT ?? "4096"}`
  }

  function opencodeAuthorization(env: Record<string, string | undefined> = process.env): Record<string, string> {
    if (!env.OPENCODE_SERVER_USERNAME || !env.OPENCODE_SERVER_PASSWORD) return {}
    return {
      Authorization: `Basic ${Buffer.from(`${env.OPENCODE_SERVER_USERNAME}:${env.OPENCODE_SERVER_PASSWORD}`).toString("base64")}`,
    }
  }

  export function opencodeURL(input: { pathname: string; access: Access; env?: Record<string, string | undefined> }) {
    const url = new URL(input.pathname, opencodeOrigin(input.env))
    url.searchParams.set("directory", input.access.directory)
    return url
  }

  export function opencodeHeaders(env: Record<string, string | undefined> = process.env) {
    return opencodeAuthorization(env)
  }

  export async function authorizeOriginalURI(input: {
    originalURI?: string
    method?: string
    access: Access
    env?: Record<string, string | undefined>
  }) {
    if (!routeAllowed(input)) return false

    const sessionID = sessionIDFromOriginalURI(input.originalURI)
    if (!sessionID) return true

    return fetch(opencodeURL({ pathname: `/session/${encodeURIComponent(sessionID)}`, access: input.access, env: input.env }), {
      headers: opencodeHeaders(input.env),
    })
      .then(async (response) => {
        if (!response.ok) return false
        return sessionMatchesAccess({
          session: (await response.json()) as { directory?: unknown; workspaceID?: unknown },
          access: input.access,
        })
      })
      .catch(() => false)
  }

  export function filterGlobalEvent(input: { data: string; access: Access }) {
    try {
      const event = JSON.parse(input.data) as {
        directory?: string
        workspace?: string
        payload?: {
          type?: string
        }
      }
      if (event.payload?.type === "server.connected" || event.payload?.type === "server.heartbeat") return input.data
      if (event.directory === input.access.directory) return input.data
      if (event.workspace && event.workspace === input.access.workspaceID) return input.data
      return
    } catch {
      return
    }
  }
}
