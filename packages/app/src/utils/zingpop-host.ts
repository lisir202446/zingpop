export function isZingpopHostedWorkbench() {
  if (typeof window === "undefined") return false
  if (window.location.hostname === "app.zingpop.cn") return true
  return (import.meta.env as { VITE_ZINGPOP_HOSTED_WORKBENCH?: string }).VITE_ZINGPOP_HOSTED_WORKBENCH === "1"
}

export function localFolderSyncEnabled() {
  if (!isZingpopHostedWorkbench()) return false
  return (import.meta.env as { VITE_ZINGPOP_LOCAL_FOLDER_SYNC?: string }).VITE_ZINGPOP_LOCAL_FOLDER_SYNC !== "0"
}
