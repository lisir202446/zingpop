import { describe, expect, test } from "bun:test"

const config = await Bun.file(new URL("../../../../deploy/nginx/zingpop-app.conf", import.meta.url)).text()

describe("nginx workbench isolation", () => {
  test("uses auth status as the source of the opencode directory", () => {
    expect(config).toContain("auth_request_set $zingpop_directory $upstream_http_x_opencode_directory;")
    expect(config).toContain("proxy_set_header X-Opencode-Directory $zingpop_directory;")
    expect(config).toContain("proxy_set_header X-Opencode-Workspace $zingpop_workspace;")
    expect(config).toContain("proxy_set_header X-Original-Method $request_method;")
    expect(config).not.toContain('if ($zingpop_directory = "")')
  })

  test("prepends the authorized directory before any client query string", () => {
    expect(config).toContain("proxy_pass http://127.0.0.1:4096$uri?directory=$zingpop_directory&$args;")
    expect(config).not.toContain("workspace=$zingpop_workspace")
  })

  test("filters event streams and blocks shared management routes on the public app host", () => {
    expect(config).toContain("location = /global/event")
    expect(config).toContain("proxy_pass http://127.0.0.1:3000/auth/workbench/event;")
    expect(config).toContain("location ~ ^/(sync|tui)(/|$)")
    expect(config).toContain("location ~ ^/(global/(dispose|upgrade)|instance/dispose)$")
  })
})
