import { defineConfig } from "vite"
import desktopPlugin from "./vite"

const zingpopConsoleOrigin = process.env.VITE_ZINGPOP_CONSOLE_ORIGIN
const opencodeServerOrigin = process.env.VITE_OPENCODE_SERVER_ORIGIN ?? "http://127.0.0.1:4096"
const opencodeApiRoutes = [
  "/agent",
  "/app",
  "/auth",
  "/command",
  "/config",
  "/experimental",
  "/file",
  "/find",
  "/formatter",
  "/global",
  "/instance",
  "/lsp",
  "/mcp",
  "/part",
  "/path",
  "/permission",
  "/project",
  "/provider",
  "/pty",
  "/question",
  "/session",
  "/sync",
  "/tool",
  "/tui",
  "/vcs",
  "/worktree",
]
const opencodeProxy = Object.fromEntries(
  opencodeApiRoutes.map((route) => [
    route,
    {
      target: opencodeServerOrigin,
      changeOrigin: true,
    },
  ]),
)

export default defineConfig({
  plugins: [desktopPlugin] as any,
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 3000,
    proxy: {
      ...opencodeProxy,
      ...(zingpopConsoleOrigin
        ? {
            "/_zingpop": {
              target: zingpopConsoleOrigin,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/_zingpop/, "/zingpop"),
            },
          }
        : {}),
    },
  },
  build: {
    target: "esnext",
    // sourcemap: true,
  },
})
