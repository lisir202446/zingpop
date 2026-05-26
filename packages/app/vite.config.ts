import { defineConfig } from "vite"
import desktopPlugin from "./vite"

const zingpopConsoleOrigin = process.env.VITE_ZINGPOP_CONSOLE_ORIGIN

export default defineConfig({
  plugins: [desktopPlugin] as any,
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 3000,
    proxy: zingpopConsoleOrigin
      ? {
          "/_zingpop": {
            target: zingpopConsoleOrigin,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/_zingpop/, "/zingpop"),
          },
        }
      : undefined,
  },
  build: {
    target: "esnext",
    // sourcemap: true,
  },
})
