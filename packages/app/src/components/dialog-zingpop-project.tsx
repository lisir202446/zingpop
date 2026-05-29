import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { TextField } from "@opencode-ai/ui/text-field"
import { Show } from "solid-js"
import { createStore } from "solid-js/store"
import {
  createLocalProjectFromDirectory,
  pickLocalDirectory,
  projectApiErrorMessage,
  supportsLocalFolderPicker,
  type ZingpopProject,
} from "@/utils/local-folder-sync"

type Mode = "choices" | "git" | "empty"

export function DialogZingpopProject(props: { onSelect: (project: ZingpopProject | null) => void }) {
  const dialog = useDialog()
  const [store, setStore] = createStore({
    mode: "choices" as Mode,
    busy: false,
    error: "",
    progress: "",
    gitUrl: "",
    gitBranch: "",
    emptyName: "",
  })

  async function requestProject(path: string, body: Record<string, string | undefined>) {
    const response = await fetch(`/_zingpop/project${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    if (response.ok) return ((await response.json()) as { project: ZingpopProject }).project
    throw new Error(projectApiErrorMessage(response.status, (await response.json().catch(() => undefined)) as { error?: string } | undefined))
  }

  async function run(action: () => Promise<ZingpopProject>) {
    if (store.busy) return
    setStore({ busy: true, error: "", progress: "" })
    try {
      props.onSelect(await action())
      dialog.close()
    } catch (error) {
      setStore("error", error instanceof Error ? error.message : String(error))
    } finally {
      setStore("busy", false)
    }
  }

  const openLocalFolder = () =>
    run(async () => {
      if (!supportsLocalFolderPicker()) throw new Error("当前浏览器不能打开本机文件夹，请使用 Chrome 或 Edge")
      const result = await createLocalProjectFromDirectory(await pickLocalDirectory(), (progress) =>
        setStore("progress", progress),
      )
      if (result.skipped > 0) setStore("progress", `已跳过 ${result.skipped} 个不适合上传的文件`)
      return result.project
    })

  const importGit = () =>
    run(async () => {
      const project = await requestProject("/git", {
        url: store.gitUrl.trim(),
        branch: store.gitBranch.trim() || undefined,
      })
      return project
    })

  const createEmpty = () =>
    run(async () => {
      const project = await requestProject("/empty", { name: store.emptyName.trim() || undefined })
      return project
    })

  return (
    <Dialog title="打开项目" class="w-full max-w-[560px] mx-auto">
      <div class="flex flex-col gap-4 px-5 pb-5">
        <Show when={store.mode === "choices"}>
          <div class="grid grid-cols-1 gap-2">
            <Button icon="folder-add-left" size="large" class="justify-start px-3" disabled={store.busy} onClick={openLocalFolder}>
              打开本机文件夹
            </Button>
            <Button icon="github" size="large" class="justify-start px-3" disabled={store.busy} onClick={() => setStore("mode", "git")}>
              从 Git 仓库导入
            </Button>
            <Button icon="plus-small" size="large" class="justify-start px-3" disabled={store.busy} onClick={() => setStore("mode", "empty")}>
              新建空项目
            </Button>
          </div>
        </Show>

        <Show when={store.mode === "git"}>
          <div class="flex flex-col gap-3">
            <TextField
              autofocus
              type="text"
              label="Git 仓库地址"
              placeholder="https://github.com/user/repo"
              value={store.gitUrl}
              disabled={store.busy}
              onChange={(value) => setStore("gitUrl", value)}
            />
            <TextField
              type="text"
              label="分支"
              placeholder="main"
              value={store.gitBranch}
              disabled={store.busy}
              onChange={(value) => setStore("gitBranch", value)}
            />
            <div class="flex gap-2 justify-end">
              <Button variant="ghost" size="large" disabled={store.busy} onClick={() => setStore("mode", "choices")}>
                返回
              </Button>
              <Button variant="primary" size="large" disabled={store.busy || !store.gitUrl.trim()} onClick={importGit}>
                导入
              </Button>
            </div>
          </div>
        </Show>

        <Show when={store.mode === "empty"}>
          <div class="flex flex-col gap-3">
            <TextField
              autofocus
              type="text"
              label="项目名称"
              placeholder="新建项目"
              value={store.emptyName}
              disabled={store.busy}
              onChange={(value) => setStore("emptyName", value)}
            />
            <div class="flex gap-2 justify-end">
              <Button variant="ghost" size="large" disabled={store.busy} onClick={() => setStore("mode", "choices")}>
                返回
              </Button>
              <Button variant="primary" size="large" disabled={store.busy} onClick={createEmpty}>
                创建
              </Button>
            </div>
          </div>
        </Show>

        <Show when={store.progress}>
          <div class="text-12-regular text-text-base">{store.progress}</div>
        </Show>
        <Show when={store.error}>
          <div class="text-12-regular text-text-on-critical-base">{store.error}</div>
        </Show>
      </div>
    </Dialog>
  )
}
