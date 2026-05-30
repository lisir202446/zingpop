import { Button } from "@opencode-ai/ui/button"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { showToast } from "@opencode-ai/ui/toast"
import { For, Match, Show, Switch, createEffect, createMemo, createResource, createSignal, onCleanup } from "solid-js"
import { useSync } from "@/context/sync"
import { isZingpopHostedWorkbench } from "@/utils/zingpop-host"
import { loadZingpopPreviewArtifacts, type PreviewArtifact } from "@/utils/zingpop-preview"

function absoluteUrl(url: string) {
  return new URL(url, window.location.origin).toString()
}

async function copyArtifact(artifact: PreviewArtifact) {
  await navigator.clipboard.writeText(absoluteUrl(artifact.url))
  showToast({ variant: "success", icon: "circle-check", title: "预览链接已复制" })
}

export function ZingpopPreviewPanel() {
  const sync = useSync()
  const projectID = createMemo(() => (isZingpopHostedWorkbench() ? (sync.project?.id ?? "") : ""))
  const [refresh, setRefresh] = createSignal(0)
  const [artifacts, { refetch }] = createResource(
    () => {
      const project = projectID()
      if (!project) return
      return { project, refresh: refresh() }
    },
    (input) => loadZingpopPreviewArtifacts(input.project),
  )
  const entries = createMemo(() => artifacts()?.artifacts ?? [])
  const first = createMemo(() => entries()[0])

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
          <Match when={artifacts()?.error}>
            <div class="rounded-md border border-border-base px-2 py-2 text-12-regular text-text-weak">
              {artifacts()!.error}
            </div>
          </Match>
          <Match when={artifacts.loading && !artifacts()}>
            <div class="rounded-md border border-border-base px-2 py-2 text-12-regular text-text-weak">
              正在查找 HTML 作品...
            </div>
          </Match>
          <Match when={entries().length === 0}>
            <div class="rounded-md border border-border-base px-2 py-2 text-12-regular text-text-weak">
              当前项目还没有 HTML 作品
            </div>
          </Match>
          <Match when={first()}>
            {(artifact) => (
              <div class="flex flex-col gap-2">
                <a
                  href={artifact().url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`打开预览 ${artifact().path}`}
                  class="block h-32 w-full overflow-hidden rounded-md border border-border-base bg-background-stronger text-left"
                >
                  <iframe
                    title={artifact().path}
                    src={artifact().fileUrl}
                    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads"
                    class="pointer-events-none h-full w-full border-0 bg-white"
                  />
                </a>
                <div class="min-w-0 truncate text-12-medium text-text-strong">{artifact().name}</div>
                <div class="flex gap-2">
                  <Button
                    as="a"
                    href={artifact().url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    variant="primary"
                    icon="open-file"
                    class="flex-1"
                  >
                    打开预览
                  </Button>
                  <Button size="small" variant="secondary" icon="copy" class="flex-1" onClick={() => copyArtifact(artifact())}>
                    复制链接
                  </Button>
                </div>
                <Show when={entries().length > 1}>
                  <div class="max-h-24 overflow-y-auto border-t border-border-weaker-base pt-2">
                    <For each={entries().slice(1)}>
                      {(item) => (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex h-7 w-full items-center gap-2 rounded px-1 text-left text-12-regular text-text-muted hover:bg-background-stronger"
                        >
                          <span class="min-w-0 flex-1 truncate">{item.path}</span>
                          <span class="text-text-weak">打开</span>
                        </a>
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
