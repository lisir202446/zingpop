import { defineConfig, PluginOption } from "vite"
import { solidStart } from "@solidjs/start/config"
import { nitro } from "nitro/vite"

const nodeServer = process.env.NITRO_PRESET === "node_server"

export default defineConfig({
  plugins: [
    solidStart({
      middleware: "./src/middleware.ts",
    }) as PluginOption,
    nitro({
      compatibilityDate: "2024-09-19",
      preset: process.env.NITRO_PRESET ?? "cloudflare_module",
      ...(nodeServer
        ? {}
        : {
            cloudflare: {
              nodeCompat: true,
            },
          }),
    }),
  ],
  server: {
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      external: ["cloudflare:workers"],
    },
    minify: false,
  },
  ssr: nodeServer
    ? {
        resolve: {
          conditions: ["node-server"],
        },
      }
    : undefined,
})
