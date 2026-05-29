export type ZingpopProject = {
  id: string
  worktree: string
  name?: string
  time: { created: number; updated: number; initialized?: number }
  sandboxes: string[]
}

export type UploadCandidate = { path: string; size: number }
export type SyncAction = "unchanged" | "overwrite-local" | "conflict" | "cloud-deleted"
export type SyncDecisionInput = {
  localHash?: string
  previousLocalHash?: string
  cloudHash?: string
  previousCloudHash?: string
}
export type ManifestEntry = { path: string; size: number; sha256: string; timeUpdated: number }
export type SyncBaselineEntry = { localHash: string; cloudHash: string; timeSynced: number }
export type SyncResult = { written: string[]; conflicts: string[]; missingHandle: boolean }

type DirectoryPicker = (options?: { mode?: "read" | "readwrite" }) => Promise<LocalDirectoryHandle>
type LocalEntry = LocalFileHandle | LocalDirectoryHandle
type LocalFileHandle = {
  kind: "file"
  name: string
  getFile(): Promise<File>
  createWritable(): Promise<{ write(data: Blob | BufferSource | string): Promise<void>; close(): Promise<void> }>
}
type LocalDirectoryHandle = {
  kind: "directory"
  name: string
  values(): AsyncIterable<LocalEntry>
  getFileHandle(name: string, options?: { create?: boolean }): Promise<LocalFileHandle>
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<LocalDirectoryHandle>
  requestPermission?: (options?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>
}

type UploadFile = { path: string; contentBase64: string }
type LocalFileSnapshot = UploadCandidate & { file: File; hash: string }
type Progress = (value: string) => void
type StoredProjectSync = {
  projectID: string
  handle: LocalDirectoryHandle
  baseline: Record<string, SyncBaselineEntry>
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILE_COUNT = 2_000
const MAX_TOTAL_SIZE = 200 * 1024 * 1024
const excludedDirectories = new Set([".git", "node_modules", "dist", "build", ".next", ".turbo", ".cache"])
const DB_NAME = "zingpop-local-folder-sync"
const STORE_NAME = "projects"

export function supportsLocalFolderPicker() {
  if (typeof window === "undefined") return false
  return typeof (window as unknown as { showDirectoryPicker?: DirectoryPicker }).showDirectoryPicker === "function"
}

function safePath(value: string) {
  if (!value || value.includes("\u0000") || value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/.test(value)) {
    return
  }
  const parts = value.split("/").filter(Boolean)
  if (parts.some((part) => part === "." || part === "..")) return
  return parts.join("/")
}

export function isUploadCandidate(input: UploadCandidate) {
  if (input.size > MAX_FILE_SIZE) return false
  const path = safePath(input.path)
  if (!path) return false
  const parts = path.split("/")
  if (parts.some((part) => excludedDirectories.has(part))) return false
  const filename = parts[parts.length - 1] ?? ""
  if (filename === ".env" || filename.startsWith(".env.")) return false
  return true
}

export async function sha256Hex(input: Blob | string) {
  const buffer = typeof input === "string" ? new TextEncoder().encode(input) : await input.arrayBuffer()
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export function resolveSyncAction(input: SyncDecisionInput): SyncAction {
  if (!input.cloudHash) return "cloud-deleted"
  if (input.cloudHash === input.previousCloudHash) return "unchanged"
  if (!input.localHash) return "overwrite-local"
  if (input.localHash === input.previousLocalHash) return "overwrite-local"
  return "conflict"
}

export function projectApiErrorMessage(status: number, payload?: { error?: string }) {
  if (payload?.error) return payload.error
  if (status === 404) {
    return "当前页面没有连接 Zingpop 项目后端（/_zingpop/project）。请通过 app.zingpop.cn，或启动 console/Nginx 代理后再试。"
  }
  if (status === 401 || status === 403) return "当前登录状态没有项目权限，请重新登录后再试"
  return "请求失败"
}

function api<T>(path: string, init?: RequestInit): Promise<T> {
  return fetch(`/_zingpop/project${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  }).then(async (response) => {
    if (response.ok) return response.json() as Promise<T>
    throw new Error(projectApiErrorMessage(response.status, (await response.json().catch(() => undefined)) as { error?: string } | undefined))
  })
}

async function toBase64(file: Blob) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const chunk = 32_768
  const parts = []
  for (let i = 0; i < bytes.length; i += chunk) {
    parts.push(String.fromCharCode(...bytes.slice(i, i + chunk)))
  }
  return btoa(parts.join(""))
}

async function collectFiles(
  handle: LocalDirectoryHandle,
  progress?: Progress,
  prefix = "",
  count = { scanned: 0 },
): Promise<{ files: LocalFileSnapshot[]; skipped: number }> {
  const result: LocalFileSnapshot[] = []
  let skipped = 0

  for await (const entry of handle.values()) {
    count.scanned++
    if (count.scanned % 25 === 0) {
      progress?.(`正在扫描文件夹，已检查 ${count.scanned} 项`)
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.kind === "directory") {
      if (excludedDirectories.has(entry.name)) {
        skipped++
        continue
      }
      const child = await collectFiles(entry, progress, path, count)
      result.push(...child.files)
      skipped += child.skipped
      continue
    }

    const file = await entry.getFile()
    if (!isUploadCandidate({ path, size: file.size })) {
      skipped++
      continue
    }
    result.push({ path, size: file.size, file, hash: await sha256Hex(file) })
  }

  return { files: result, skipped }
}

function assertUploadLimits(files: LocalFileSnapshot[]) {
  if (files.length > MAX_FILE_COUNT) throw new Error(`文件数量超过 ${MAX_FILE_COUNT} 个，请选择更小的文件夹`)
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_SIZE) throw new Error("文件夹超过 200MB，请先移除大文件")
}

function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: "projectID" })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function getStoredProject(projectID: string) {
  const db = await openDB()
  return new Promise<StoredProjectSync | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const request = tx.objectStore(STORE_NAME).get(projectID)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as StoredProjectSync | undefined)
  }).finally(() => db.close())
}

async function putStoredProject(value: StoredProjectSync) {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(value)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  }).finally(() => db.close())
}

export async function pickLocalDirectory() {
  const picker = (window as unknown as { showDirectoryPicker?: DirectoryPicker }).showDirectoryPicker
  if (!picker) throw new Error("当前浏览器不能打开本机文件夹，请使用 Chrome 或 Edge")
  return picker({ mode: "readwrite" })
}

export async function createLocalProjectFromDirectory(handle: LocalDirectoryHandle, onProgress?: (value: string) => void) {
  onProgress?.("已选择文件夹，正在扫描")
  await new Promise((resolve) => setTimeout(resolve, 0))
  const collected = await collectFiles(handle, onProgress)
  onProgress?.(`扫描完成，准备上传 ${collected.files.length} 个文件`)
  assertUploadLimits(collected.files)

  const created = await api<{ project: ZingpopProject }>("/local", {
    method: "POST",
    body: JSON.stringify({ name: handle.name, sourceLabel: handle.name }),
  })

  const baseline: Record<string, SyncBaselineEntry> = {}
  for (let i = 0; i < collected.files.length; i += 25) {
    const batch = collected.files.slice(i, i + 25)
    onProgress?.(`正在上传 ${Math.min(i + batch.length, collected.files.length)} / ${collected.files.length}`)
    await api(`/${created.project.id}/files`, {
      method: "POST",
      body: JSON.stringify({
        files: await Promise.all(
          batch.map(async (file): Promise<UploadFile> => ({
            path: file.path,
            contentBase64: await toBase64(file.file),
          })),
        ),
      }),
    })
    for (const file of batch) {
      baseline[file.path] = { localHash: file.hash, cloudHash: file.hash, timeSynced: Date.now() }
    }
  }

  await putStoredProject({ projectID: created.project.id, handle, baseline })
  return { project: created.project, skipped: collected.skipped }
}

async function localFile(handle: LocalDirectoryHandle, target: string) {
  const parts = target.split("/")
  const file = parts.pop()
  if (!file) return
  const dir = await parts.reduce<Promise<LocalDirectoryHandle | undefined>>(async (previous, part) => {
    const current = await previous
    if (!current) return
    return current.getDirectoryHandle(part).catch(() => undefined)
  }, Promise.resolve(handle))
  return dir?.getFileHandle(file).then((item) => item.getFile()).catch(() => undefined)
}

async function writeLocalFile(handle: LocalDirectoryHandle, target: string, blob: Blob) {
  const parts = target.split("/")
  const file = parts.pop()
  if (!file) return
  const dir = await parts.reduce(async (previous, part) => (await previous).getDirectoryHandle(part, { create: true }), Promise.resolve(handle))
  const writable = await (await dir.getFileHandle(file, { create: true })).createWritable()
  await writable.write(blob)
  await writable.close()
}

export async function syncProjectToLocal(projectID: string): Promise<SyncResult> {
  const stored = await getStoredProject(projectID)
  if (!stored) return { written: [], conflicts: [], missingHandle: true }
  const permission = await stored.handle.requestPermission?.({ mode: "readwrite" })
  if (permission && permission !== "granted") return { written: [], conflicts: [], missingHandle: true }

  const manifest = await api<{ files: ManifestEntry[] }>(`/${projectID}/manifest`)
  const written: string[] = []
  const conflicts: string[] = []
  const baseline = { ...stored.baseline }

  for (const entry of manifest.files) {
    const previous = baseline[entry.path]
    const local = await localFile(stored.handle, entry.path)
    const localHash = local ? await sha256Hex(local) : undefined
    const action = resolveSyncAction({
      localHash,
      previousLocalHash: previous?.localHash,
      cloudHash: entry.sha256,
      previousCloudHash: previous?.cloudHash,
    })
    if (action === "unchanged" || action === "cloud-deleted") continue
    if (action === "conflict") {
      conflicts.push(entry.path)
      continue
    }

    await writeLocalFile(stored.handle, entry.path, await fetch(`/_zingpop/project/${projectID}/file?path=${encodeURIComponent(entry.path)}`).then((response) => response.blob()))
    baseline[entry.path] = { localHash: entry.sha256, cloudHash: entry.sha256, timeSynced: Date.now() }
    written.push(entry.path)
  }

  await putStoredProject({ ...stored, baseline })
  return { written, conflicts, missingHandle: false }
}
