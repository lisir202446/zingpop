import { execFile } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import type { Configuration } from "electron-builder"

const execFileAsync = promisify(execFile)
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const signScript = path.join(rootDir, "script", "sign-windows.ps1")

async function signWindows(configuration: { path: string }) {
  if (process.platform !== "win32") return
  if (process.env.GITHUB_ACTIONS !== "true") return

  await execFileAsync(
    "pwsh",
    ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", signScript, configuration.path],
    { cwd: rootDir },
  )
}

const channel = (() => {
  const raw = process.env.OPENCODE_CHANNEL
  if (raw === "dev" || raw === "beta" || raw === "prod") return raw
  return "dev"
})()
const shouldSignWindows = process.env.GITHUB_ACTIONS === "true"

const getBase = (): Configuration => ({
  artifactName: "zingpop-desktop-${os}-${arch}.${ext}",
  directories: {
    output: "dist",
    buildResources: "resources",
  },
  files: ["out/**/*", "resources/**/*"],
  extraResources: [
    {
      from: "resources/icons",
      to: "icons",
    },
    {
      from: "native/",
      to: "native/",
      filter: ["index.js", "index.d.ts", "build/Release/mac_window.node", "swift-build/**"],
    },
  ],
  mac: {
    category: "public.app-category.developer-tools",
    icon: `resources/icons/icon.icns`,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "resources/entitlements.plist",
    entitlementsInherit: "resources/entitlements.plist",
    notarize: true,
    target: ["dmg", "zip"],
  },
  dmg: {
    sign: true,
  },
  protocols: {
    name: "Zingpop",
    schemes: ["zingpop", "opencode"],
  },
  win: {
    icon: `resources/icons/icon.ico`,
    signAndEditExecutable: shouldSignWindows,
    signtoolOptions: shouldSignWindows ? { sign: signWindows } : undefined,
    target: ["nsis"],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: `resources/icons/icon.ico`,
    installerHeaderIcon: `resources/icons/icon.ico`,
  },
  linux: {
    icon: `resources/icons`,
    category: "Development",
    target: ["AppImage", "deb", "rpm"],
  },
})

function getConfig() {
  const base = getBase()

  switch (channel) {
    case "dev": {
      return {
        ...base,
        appId: "cn.zingpop.desktop.dev",
        productName: "Zingpop Dev",
        rpm: { packageName: "zingpop-dev" },
      }
    }
    case "beta": {
      return {
        ...base,
        appId: "cn.zingpop.desktop.beta",
        productName: "Zingpop Beta",
        protocols: { name: "Zingpop Beta", schemes: ["zingpop", "opencode"] },
        publish: { provider: "github", owner: "lisir202446", repo: "zingpop", channel: "beta" },
        rpm: { packageName: "zingpop-beta" },
      }
    }
    case "prod": {
      return {
        ...base,
        appId: "cn.zingpop.desktop",
        productName: "Zingpop",
        protocols: { name: "Zingpop", schemes: ["zingpop", "opencode"] },
        publish: { provider: "github", owner: "lisir202446", repo: "zingpop", channel: "latest" },
        rpm: { packageName: "zingpop" },
      }
    }
  }
}

export default getConfig()
