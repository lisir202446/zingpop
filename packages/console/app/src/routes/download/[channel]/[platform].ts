import type { APIEvent } from "@solidjs/start"
import type { DownloadPlatform } from "../types"

const prodAssetNames: Record<string, string> = {
  "darwin-aarch64-dmg": "zingpop-desktop-mac-arm64.dmg",
  "darwin-x64-dmg": "zingpop-desktop-mac-x64.dmg",
  "windows-x64-nsis": "zingpop-desktop-win-x64.exe",
  "linux-x64-deb": "zingpop-desktop-linux-amd64.deb",
  "linux-x64-appimage": "zingpop-desktop-linux-x86_64.AppImage",
  "linux-x64-rpm": "zingpop-desktop-linux-x86_64.rpm",
} satisfies Record<DownloadPlatform, string>

const betaAssetNames: Record<string, string> = {
  "darwin-aarch64-dmg": "zingpop-desktop-mac-arm64.dmg",
  "darwin-x64-dmg": "zingpop-desktop-mac-x64.dmg",
  "windows-x64-nsis": "zingpop-desktop-win-x64.exe",
  "linux-x64-deb": "zingpop-desktop-linux-amd64.deb",
  "linux-x64-appimage": "zingpop-desktop-linux-x86_64.AppImage",
  "linux-x64-rpm": "zingpop-desktop-linux-x86_64.rpm",
} satisfies Record<DownloadPlatform, string>

// Doing this on the server lets us preserve the original name for platforms we don't care to rename for
const downloadNames: Record<string, string> = {
  "darwin-aarch64-dmg": "Zingpop Desktop.dmg",
  "darwin-x64-dmg": "Zingpop Desktop.dmg",
  "windows-x64-nsis": "Zingpop Desktop Installer.exe",
} satisfies { [K in DownloadPlatform]?: string }

export async function GET({ params: { platform, channel } }: APIEvent) {
  const assetName = channel === "stable" ? prodAssetNames[platform] : betaAssetNames[platform]
  if (!assetName) return new Response(null, { status: 404 })

  const releaseRepo = process.env.ZINGPOP_DESKTOP_RELEASE_REPO ?? "lisir202446/zingpop"
  const releasePath =
    process.env.ZINGPOP_DESKTOP_RELEASE_TAG && process.env.ZINGPOP_DESKTOP_RELEASE_TAG !== "latest"
      ? `releases/download/${process.env.ZINGPOP_DESKTOP_RELEASE_TAG}`
      : "releases/latest/download"

  const resp = await fetch(
    `https://github.com/${releaseRepo}/${releasePath}/${assetName}`,
    {
      cf: {
        // in case gh releases has rate limits
        cacheTtl: 60 * 5,
        cacheEverything: true,
      },
    } as any,
  )

  const downloadName = downloadNames[platform]

  const headers = new Headers(resp.headers)
  if (downloadName) headers.set("content-disposition", `attachment; filename="${downloadName}"`)

  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers })
}
