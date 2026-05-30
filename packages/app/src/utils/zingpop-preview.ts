import type { ManifestEntry } from "@/utils/local-folder-sync"

export type PreviewArtifact = {
  path: string
  name: string
  url: string
  fileUrl: string
  timeUpdated: number
}

type PreviewRefreshStatus = { type: "idle" | "busy" } | { type: "retry"; attempt: number; message: string; next: number }

export function shouldRefreshPreviewArtifacts(
  previous: PreviewRefreshStatus | undefined,
  next: PreviewRefreshStatus | undefined,
) {
  return previous !== undefined && previous.type !== "idle" && next?.type === "idle"
}

export function isZingpopPreviewArtifact(path: string) {
  return /\.(html|htm)$/i.test(path)
}

function encodedPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/")
}

export function zingpopPreviewUrl(projectID: string, path: string) {
  return `/_zingpop/preview/${encodeURIComponent(projectID)}/${encodedPath(path)}`
}

export function zingpopPreviewFileUrl(projectID: string, path: string) {
  return `/_zingpop/preview-file/${encodeURIComponent(projectID)}/${encodedPath(path)}`
}

export function previewArtifactName(path: string) {
  return path.split("/").pop() || path
}

export function previewArtifacts(projectID: string, files: ManifestEntry[]) {
  return files
    .filter((file) => isZingpopPreviewArtifact(file.path))
    .map((file): PreviewArtifact => ({
      path: file.path,
      name: previewArtifactName(file.path),
      url: zingpopPreviewUrl(projectID, file.path),
      fileUrl: zingpopPreviewFileUrl(projectID, file.path),
      timeUpdated: file.timeUpdated,
    }))
    .sort((a, b) => {
      if (a.name === "index.html" && b.name !== "index.html") return -1
      if (b.name === "index.html" && a.name !== "index.html") return 1
      return b.timeUpdated - a.timeUpdated || a.path.localeCompare(b.path)
    })
}

export async function listZingpopPreviewArtifacts(projectID: string) {
  const response = await fetch(`/_zingpop/project/${encodeURIComponent(projectID)}/manifest`, {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Unable to load project files")

  const body = (await response.json()) as { files?: ManifestEntry[] }
  return previewArtifacts(projectID, body.files ?? [])
}

export async function loadZingpopPreviewArtifacts(projectID: string) {
  return listZingpopPreviewArtifacts(projectID)
    .then((artifacts) => ({ artifacts, error: "" }))
    .catch(() => ({ artifacts: [] as PreviewArtifact[], error: "无法加载作品列表" }))
}
