export type DownloadPlatform =
  | `darwin-${"x64" | "aarch64"}-dmg`
  | "windows-x64-zip"
  | `linux-x64-${"deb" | "rpm" | "appimage"}`
