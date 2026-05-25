import { afterEach, describe, expect, test } from "bun:test"
import { Workbench } from "../src/workbench"

const previous = {
  root: process.env.ZINGPOP_WORKSPACE_ROOT,
}

function restore(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
    return
  }
  process.env[name] = value
}

afterEach(() => {
  restore("ZINGPOP_WORKSPACE_ROOT", previous.root)
})

describe("workbench isolation", () => {
  test("maps a workspace and project to a directory inside the configured root", () => {
    process.env.ZINGPOP_WORKSPACE_ROOT = "/srv/zingpop/workspaces"

    expect(Workbench.directory({ workspaceID: "wrk_123", projectID: "default" })).toBe(
      "/srv/zingpop/workspaces/wrk_123/projects/default",
    )
  })

  test("rejects workspace and project traversal", () => {
    process.env.ZINGPOP_WORKSPACE_ROOT = "/srv/zingpop/workspaces"

    expect(() => Workbench.directory({ workspaceID: "../root", projectID: "default" })).toThrow("Unsafe workspace id")
    expect(() => Workbench.directory({ workspaceID: "wrk_123", projectID: "../../root" })).toThrow("Unsafe project id")
  })

  test("builds the opencode headers from the server-authorized directory", () => {
    process.env.ZINGPOP_WORKSPACE_ROOT = "/srv/zingpop/workspaces"
    const access = Workbench.accessHeaders({
      workspaceID: "wrk_123",
      projectID: "default",
      directory: Workbench.directory({ workspaceID: "wrk_123", projectID: "default" }),
    })

    expect(access).toEqual({
      "X-Opencode-Directory": "/srv/zingpop/workspaces/wrk_123/projects/default",
      "X-Opencode-Workspace": "wrk_123",
      "X-Zingpop-Project-ID": "default",
      "X-Zingpop-Workspace-ID": "wrk_123",
    })
  })

  test("extracts session ids from original workbench routes", () => {
    expect(Workbench.sessionIDFromOriginalURI("/session/ses_123/message?directory=/root")).toBe("ses_123")
    expect(Workbench.sessionIDFromOriginalURI("https://app.zingpop.cn/session/ses_123")).toBe("ses_123")
    expect(Workbench.sessionIDFromOriginalURI("/event")).toBeUndefined()
  })

  test("does not treat session collection routes as session ids", () => {
    expect(Workbench.sessionIDFromOriginalURI("/session")).toBeUndefined()
    expect(Workbench.sessionIDFromOriginalURI("/session/status")).toBeUndefined()
    expect(Workbench.sessionIDFromOriginalURI("/session/status?directory=/root")).toBeUndefined()
  })

  test("does not send zingpop workspace ids to opencode workspace routing", () => {
    const url = Workbench.opencodeURL({
      pathname: "/session/ses_123",
      access: {
        workspaceID: "wrk_123",
        projectID: "default",
        directory: "/srv/zingpop/workspaces/wrk_123/projects/default",
      },
      env: {
        ZINGPOP_OPENCODE_ORIGIN: "http://127.0.0.1:4096",
      },
    })

    expect(url.searchParams.get("directory")).toBe("/srv/zingpop/workspaces/wrk_123/projects/default")
    expect(url.searchParams.has("workspace")).toBe(false)
  })

  test("blocks public access to shared management routes", () => {
    expect(Workbench.routeAllowed({ originalURI: "/global/config", method: "GET" })).toBe(true)
    expect(Workbench.routeAllowed({ originalURI: "/global/config", method: "PATCH" })).toBe(false)
    expect(Workbench.routeAllowed({ originalURI: "/global/dispose", method: "POST" })).toBe(false)
    expect(Workbench.routeAllowed({ originalURI: "/sync/history", method: "POST" })).toBe(false)
    expect(Workbench.routeAllowed({ originalURI: "/tui/select-session", method: "POST" })).toBe(false)
  })

  test("matches session ownership against the authorized directory", () => {
    const access = {
      workspaceID: "wrk_123",
      projectID: "default",
      directory: "/srv/zingpop/workspaces/wrk_123/projects/default",
    }

    expect(
      Workbench.sessionMatchesAccess({
        access,
        session: { directory: "/srv/zingpop/workspaces/wrk_123/projects/default", workspaceID: "wrk_123" },
      }),
    ).toBe(true)
    expect(
      Workbench.sessionMatchesAccess({
        access,
        session: { directory: "/srv/zingpop/workspaces/wrk_456/projects/default", workspaceID: "wrk_456" },
      }),
    ).toBe(false)
  })

  test("filters global events to the authorized directory", () => {
    const access = {
      workspaceID: "wrk_123",
      projectID: "default",
      directory: "/srv/zingpop/workspaces/wrk_123/projects/default",
    }
    const allowed = JSON.stringify({
      directory: "/srv/zingpop/workspaces/wrk_123/projects/default",
      payload: { type: "session.updated" },
    })
    const denied = JSON.stringify({
      directory: "/srv/zingpop/workspaces/wrk_456/projects/default",
      payload: { type: "session.updated" },
    })

    expect(Workbench.filterGlobalEvent({ data: allowed, access })).toBe(allowed)
    expect(Workbench.filterGlobalEvent({ data: denied, access })).toBeUndefined()
  })
})
