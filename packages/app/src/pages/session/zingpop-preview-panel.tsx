import { Button } from "@opencode-ai/ui/button"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { showToast } from "@opencode-ai/ui/toast"
import { For, Match, Show, Switch, createEffect, createMemo, createResource, createSignal, onCleanup } from "solid-js"
import { useSync } from "@/context/sync"
import { isZingpopHostedWorkbench } from "@/utils/zingpop-host"
import { listZingpopPreviewArtifacts, type PreviewArtifact } from "@/utils/zingpop-preview"

function absoluteUrl(url: string) {
  return new URL(url, window.location.origin).toString()
}

function openArtifact(artifact: PreviewArtifact) {
  window.open(artifact.url, "_blank", "noopener,noreferrer")
}

async function copyArtifact(artifact: PreviewArtifact) {
  await navigator.clipboard.writeText(absoluteUrl(artifact.url))
  showToast({ variant: "success", icon: "circle-check", title: "预览链接已复制" })
}

export function ZingpopPreviewPanel() {
  const sync = useSync()
  const projectID = createMemo(() => (isZingpopHostedWorkbench() ? sync.data.project : ""))
  const [refresh, setRefresh] = createSignal(0)
  const [artifacts, { refetch }] = createResource(
    () => {
      const project = projectID()
      if (!project) return
      return { project, refresh: refresh() }
    },
    (input) => listZingpopPreviewArtifacts(input.project),
  )
  const first = createMemo(() => artifacts()?.[0])

  createEffect(() => {
    if (!projectID()) return
    const timer = window.setInterval(() => setRefresh((value) => value + 1), 8_000)
    onCleanup(() => window.clearInterval(timer))
  })

  return (
    <Show when={projectID()}>
      <section class="border-b border-border-weaker-base bg-background px-3 py-3">
        <div class="mb-2 flex items-center gap-2">
          <div class="min-w-0 flex-1">
            <div class="text-12-medium text-text-strong">作品预览</div>
            <div class="truncate text-11-regular text-text-weak">HTML 文件会自动出现在这里</div>
          </div>
          <IconButton
            icon="reset"
            size="small"
            variant="ghost"
            aria-label="刷新作品预览"
            onClick={() => refetch()}
          />
        </div>

        <Switch>
          <Match when={artifacts.error}>
            <div class="rounded-md border border-border-base px-2 py-2 text-12-regular text-text-weak">
              无法加载作品列表
            </div>
          </Match>
          <Match when={artifacts.loading && !artifacts()}>
            <div class="rounded-md border border-border-base px-2 py-2 text-12-regular text-text-weak">
              正在查找 HTML 作品...
            </div>
          </Match>
          <Match when={(artifacts()?.length ?? 0) === 0}>
            <div class="rounded-md border border-border-base px-2 py-2 text-12-regular text-text-weak">
              当前项目还没有 HTML 作品
            </div>
          </Match>
          <Match when={first()}>
            {(artifact) => (
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  aria-label={`打开预览 ${artifact().path}`}
                  class="h-32 overflow-hidden rounded-md border border-border-base bg-background-stronger text-left"
                  onClick={() => openArtifact(artifact())}
                >
                  <iframe
                    title={artifact().path}
                    src={artifact().fileUrl}
                    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads"
                    class="pointer-events-none h-full w-full border-0 bg-white"
                  />
                </button>
                <div class="min-w-0 truncate text-12-medium text-text-strong">{artifact().name}</div>
                <div class="flex gap-2">
                  <Button size="small" variant="primary" icon="open-file" class="flex-1" onClick={() => openArtifact(artifact())}>
                    打开预览
                  </Button>
                  <Button size="small" variant="secondary" icon="copy" class="flex-1" onClick={() => copyArtifact(artifact())}>
                    复制链接
                  </Button>
                </div>
                <Show when={(artifacts()?.length ?? 0) > 1}>
                  <div class="max-h-24 overflow-y-auto border-t border-border-weaker-base pt-2">
                    <For each={artifacts()!.slice(1)}>
                      {(item) => (
                        <button
                          type="button"
                          class="flex h-7 w-full items-center gap-2 rounded px-1 text-left text-12-regular text-text-muted hover:bg-background-stronger"
                          onClick={() => openArtifact(item)}
                        >
                          <span class="min-w-0 flex-1 truncate">{item.path}</span>
                          <span class="text-text-weak">打开</span>
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            )}
          </Match>
        </Switch>
      </section>
    </Show>
  )
}
