import type { ManifestEntry } from "@/utils/local-folder-sync"
import type { Part } from "@opencode-ai/sdk/v2"

export type PreviewArtifact = {
  path: string
  name: string
  url: string
  fileUrl: string
  timeUpdated: number
  html?: string
}

type PreviewRefreshStatus =
  | { type: "idle" | "busy" }
  | { type: "retry"; attempt: number; message: string; next: number }

export type PreviewArtifactPanelState =
  | { type: "preview"; artifact: PreviewArtifact }
  | { type: "error"; error: string }
  | { type: "loading" }
  | { type: "empty" }

const previewTargetReadRetryDelays = [120, 240, 500, 1_000, 1_500, 2_000] as const

type TurnMessage = {
  id: string
  role: string
  parentID?: string
}

function assistantMessagesForTurn(messages: TurnMessage[], messageID: string) {
  const linked = messages.filter((message) => message.role === "assistant" && message.parentID === messageID)
  if (linked.length > 0) return linked

  const turnStart = messages.findIndex((message) => message.id === messageID)
  if (turnStart === -1) return []

  const candidates = messages.slice(turnStart + 1)
  const nextUser = candidates.findIndex((message) => message.role === "user")
  return candidates.slice(0, nextUser === -1 ? undefined : nextUser).filter((message) => message.role === "assistant")
}

export function shouldRefreshPreviewArtifacts(
  previous: PreviewRefreshStatus | undefined,
  next: PreviewRefreshStatus | undefined,
) {
  return previous !== undefined && previous.type !== "idle" && next?.type === "idle"
}

export function previewTargetReadRetryDelay(input: {
  targetPath?: string
  targetArtifact?: PreviewArtifact
  loading: boolean
  attempt: number
}) {
  if (!input.targetPath || input.targetArtifact || input.loading) return
  return previewTargetReadRetryDelays[input.attempt]
}

export function isZingpopPreviewArtifact(path: string) {
  return /\.(html|htm)$/i.test(path)
}

function encodedPath(path: string) {
  return normalizePreviewArtifactPath(path).split("/").map(encodeURIComponent).join("/")
}

export function zingpopPreviewUrl(projectID: string, path: string) {
  return `/_zingpop/preview/${encodeURIComponent(projectID)}/${encodedPath(path)}`
}

export function zingpopPreviewFileUrl(projectID: string, path: string) {
  return `/_zingpop/preview-file/${encodeURIComponent(projectID)}/${encodedPath(path)}`
}

export function normalizePreviewArtifactPath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\.\//, "")
}

export function previewArtifactPathForDirectory(path: string, directory?: string) {
  const normalized = normalizePreviewArtifactPath(path)
  if (!directory) return normalized

  const root = normalizePreviewArtifactPath(directory).replace(/\/+$/, "")
  if (!root) return normalized

  const lower = normalized.toLowerCase()
  const lowerRoot = root.toLowerCase()
  if (lower === lowerRoot) return ""
  if (lower.startsWith(`${lowerRoot}/`)) return normalized.slice(root.length + 1)

  return normalized
}

export function previewArtifactName(path: string) {
  return normalizePreviewArtifactPath(path).split("/").pop() || path
}

function firstString(input: { [key: string]: unknown }, keys: readonly string[]) {
  return keys.map((key) => input[key]).find((value): value is string => typeof value === "string" && value.length > 0)
}

function htmlPathsFromText(text: string) {
  return Array.from(text.matchAll(/(?:^|[\s"'`(（])((?:[A-Za-z]:)?[^\s"'`<>()（）]+?\.(?:html|htm))/gi))
    .map((match) => match[1]?.replace(/[，。！？；：,.!?;:]+$/, ""))
    .filter((path): path is string => !!path && isZingpopPreviewArtifact(path))
}

function toolText(part: Extract<Part, { type: "tool" }>) {
  const values = [
    firstString(part.state.input, ["filePath", "path", "command", "description", "query"]),
    part.state.status === "completed" ? part.state.title : undefined,
    part.state.status === "completed" ? part.state.output : undefined,
    part.state.status === "error" ? part.state.error : undefined,
  ]
  return values.filter((value): value is string => !!value).join("\n")
}

export function previewArtifactPathFromParts(parts: Part[]) {
  return parts
    .flatMap((part): string[] => {
      if (part.type === "text") return htmlPathsFromText(part.text)
      if (part.type !== "tool") return []
      if (part.tool === "write" || part.tool === "edit") {
        const path = firstString(part.state.input, ["filePath", "path"])
        if (path && isZingpopPreviewArtifact(path)) return [path]
      }
      return htmlPathsFromText(toolText(part))
    })
    .at(-1)
}

export function previewArtifactPathForTurn(input: {
  messages: TurnMessage[]
  parts: Record<string, Part[] | undefined>
  messageID: string
}) {
  return previewArtifactPathFromParts(
    assistantMessagesForTurn(input.messages, input.messageID).flatMap((message) => input.parts[message.id] ?? []),
  )
}

export function previewArtifactPathForLatestTurn(input: {
  messages: TurnMessage[]
  parts: Record<string, Part[] | undefined>
}) {
  const latest = input.messages.findLast((message) => message.role === "user")
  if (!latest) return
  return previewArtifactPathForTurn({ ...input, messageID: latest.id })
}

export function previewArtifactFromFileContent(
  path: string,
  file: { type: "text" | "binary"; content: string } | undefined,
) {
  const normalized = normalizePreviewArtifactPath(path)
  if (!file || file.type !== "text" || !isZingpopPreviewArtifact(normalized)) return
  return {
    path: normalized,
    name: previewArtifactName(normalized),
    url: "",
    fileUrl: "",
    timeUpdated: Date.now(),
    html: file.content,
  } satisfies PreviewArtifact
}

export function previewArtifactPanelState(input: {
  artifact?: PreviewArtifact
  error?: string
  loading: boolean
}): PreviewArtifactPanelState {
  if (input.artifact) return { type: "preview", artifact: input.artifact }
  if (input.error) return { type: "error", error: input.error }
  if (input.loading) return { type: "loading" }
  return { type: "empty" }
}

export function previewArtifacts(projectID: string, files: ManifestEntry[]) {
  return files
    .filter((file) => isZingpopPreviewArtifact(file.path))
    .map(
      (file): PreviewArtifact => ({
        path: file.path,
        name: previewArtifactName(file.path),
        url: zingpopPreviewUrl(projectID, file.path),
        fileUrl: zingpopPreviewFileUrl(projectID, file.path),
        timeUpdated: file.timeUpdated,
      }),
    )
    .sort((a, b) => {
      if (a.name === "index.html" && b.name !== "index.html") return -1
      if (b.name === "index.html" && a.name !== "index.html") return 1
      return b.timeUpdated - a.timeUpdated || a.path.localeCompare(b.path)
    })
}

export function selectPreviewArtifact(artifacts: PreviewArtifact[], preferredPath?: string, fallback = true) {
  if (!preferredPath) return fallback ? artifacts[0] : undefined
  const normalized = normalizePreviewArtifactPath(preferredPath)
  return (
    artifacts.find(
      (artifact) =>
        normalizePreviewArtifactPath(artifact.path) === normalized || artifact.name === previewArtifactName(normalized),
    ) ?? (fallback ? artifacts[0] : undefined)
  )
}

function matchesPreviewTarget(artifact: PreviewArtifact, targetPath: string) {
  const normalized = normalizePreviewArtifactPath(targetPath)
  return normalizePreviewArtifactPath(artifact.path) === normalized || artifact.name === previewArtifactName(normalized)
}

export function selectVisiblePreviewArtifact(input: {
  artifacts: PreviewArtifact[]
  targetPath?: string
  targetArtifact?: PreviewArtifact
  manifestFallback?: boolean
}) {
  const targetPath = input.targetPath ? normalizePreviewArtifactPath(input.targetPath) : undefined
  const artifact = targetPath ? selectPreviewArtifact(input.artifacts, targetPath, false) : undefined
  if (artifact) return artifact
  if (targetPath && input.targetArtifact && matchesPreviewTarget(input.targetArtifact, targetPath)) {
    return input.targetArtifact
  }
  return input.manifestFallback === true ? selectPreviewArtifact(input.artifacts) : undefined
}

export async function listZingpopPreviewArtifacts(projectID: string) {
  const response = await fetch(`/_zingpop/project/${encodeURIComponent(projectID)}/manifest?preview=html`, {
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
