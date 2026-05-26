import { describe, expect, test } from "bun:test"

const config = await Bun.file(new URL("../../../../deploy/nginx/zingpop-app.conf", import.meta.url)).text()

function locationBlock(path: string) {
  const match = config.match(new RegExp(`location = ${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{[\\s\\S]*?\\n    \\}`))
  return match?.[0] ?? ""
}

describe("nginx workbench isolation", () => {
  test("uses auth status as the source of the opencode directory", () => {
    expect(config).toContain("auth_request_set $zingpop_directory $upstream_http_x_opencode_directory;")
    expect(config).toContain("proxy_set_header X-Opencode-Directory $zingpop_directory;")
    expect(config).toContain("proxy_set_header X-Opencode-Workspace $zingpop_workspace;")
    expect(config).toContain("proxy_set_header X-Original-Method $request_method;")
    expect(config).not.toContain('if ($zingpop_directory = "")')
  })

  test("prepends the authorized directory before any client query string", () => {
    expect(config).toContain("proxy_pass http://127.0.0.1:4096$uri?directory=$zingpop_directory&$zingpop_client_args;")
    expect(config).not.toContain("workspace=$zingpop_workspace")
  })

  test("drops client supplied directory parameters before proxying", () => {
    expect(config).toContain("set $zingpop_client_args $args;")
    expect(config).toContain('if ($arg_directory != "")')
    expect(config).toContain("set $zingpop_client_args \"\";")
  })

  test("rejects client supplied opencode workspace routing parameters", () => {
    expect(config).toContain('if ($arg_workspace != "")')
    expect(config).toContain("return 403;")
  })

  test("filters event streams and blocks shared management routes on the public app host", () => {
    expect(config).toContain("location = /global/event")
    expect(config).toContain("proxy_pass http://127.0.0.1:3000/auth/workbench/event;")
    expect(config).toContain("location ^~ /_zingpop/")
    expect(config).toContain("proxy_pass http://127.0.0.1:3000/zingpop/")
    expect(config).toContain("location ~ ^/(sync|tui)(/|$)")
    expect(config).toContain("location ~ ^/experimental/workspace(/|$)")
    expect(config).toContain("location ~ ^/(global/(dispose|upgrade)|instance/dispose)$")
  })

  test("allows session status reload through the authorized directory proxy", () => {
    const block = locationBlock("/session/status")

    expect(block).toContain("auth_request /_zingpop_auth;")
    expect(block).toContain("auth_request_set $zingpop_directory $upstream_http_x_opencode_directory;")
    expect(block).toContain("proxy_pass http://127.0.0.1:4096$uri?directory=$zingpop_directory&$zingpop_client_args;")
    expect(block).toContain("include /etc/nginx/snippets/zingpop-opencode-basic-auth.conf;")
    expect(block).toContain('if ($arg_workspace != "")')
    expect(block).toContain("return 403;")
  })

  test("serves static app metadata without product auth redirect", () => {
    const staticFiles = [
      "/site.webmanifest",
      "/favicon-v3.ico",
      "/favicon-v3.svg",
      "/favicon-96x96-v3.png",
      "/apple-touch-icon-v3.png",
      "/oc-theme-preload.js",
    ]

    for (const file of staticFiles) {
      const block = locationBlock(file)
      expect(block).toContain("root /opt/zingpop/app/dist;")
      expect(block).toContain("try_files $uri =404;")
      expect(block).not.toContain("auth_request")
      expect(block).not.toContain("@zingpop_login")
    }
  })
})
