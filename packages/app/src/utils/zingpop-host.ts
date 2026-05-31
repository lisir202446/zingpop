type ZingpopHostedWorkbenchEnv = {
  VITE_ZINGPOP_HOSTED_WORKBENCH?: string
}

export function shouldUseZingpopHostedWorkbench(input: { hostname?: string; env?: ZingpopHostedWorkbenchEnv }) {
  if (input.env?.VITE_ZINGPOP_HOSTED_WORKBENCH === "1") return true
  return (input.hostname ?? "").toLowerCase() === "app.zingpop.cn"
}

export function isZingpopHostedWorkbench() {
  return shouldUseZingpopHostedWorkbench({
    hostname: typeof window === "undefined" ? undefined : window.location.hostname,
    env: import.meta.env as ZingpopHostedWorkbenchEnv,
  })
}

export function localFolderSyncEnabled() {
  if (!isZingpopHostedWorkbench()) return false
  return (import.meta.env as { VITE_ZINGPOP_LOCAL_FOLDER_SYNC?: string }).VITE_ZINGPOP_LOCAL_FOLDER_SYNC !== "0"
}
