import { Button } from "@opencode-ai/ui/button"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { For, Match, Show, Switch, createEffect, createMemo, createResource, on, onCleanup } from "solid-js"
import { useSync } from "@/context/sync"
import { useSessionLayout } from "@/pages/session/session-layout"
import { copyPreviewArtifact, ZingpopPreviewBrowserCard } from "@/pages/session/zingpop-preview-browser-card"
import { isZingpopHostedWorkbench } from "@/utils/zingpop-host"
import {
  loadZingpopPreviewArtifacts,
  shouldRefreshPreviewArtifacts,
} from "@/utils/zingpop-preview"

const idle = { type: "idle" as const }

function createZingpopPreviewArtifacts() {
  const sync = useSync()
  const { params } = useSessionLayout()
  const projectID = createMemo(() => (isZingpopHostedWorkbench() ? (sync.project?.id ?? "") : ""))
  const [artifacts, { refetch }] = createResource(
    () => {
      const project = projectID()
      if (!project) return
      return project
    },
    (project) => loadZingpopPreviewArtifacts(project),
  )
  const entries = createMemo(() => artifacts()?.artifacts ?? [])
  const first = createMemo(() => entries()[0])
  const status = createMemo(() => (params.id ? (sync.data.session_status[params.id] ?? idle) : idle))
  let refreshTimer: number | undefined

  createEffect(
    on(
      status,
      (next, previous) => {
        if (!projectID()) return
        if (!shouldRefreshPreviewArtifacts(previous, next)) return
        if (refreshTimer !== undefined) window.clearTimeout(refreshTimer)
        refreshTimer = window.setTimeout(() => {
          refreshTimer = undefined
          void refetch()
        }, 350)
      },
      { defer: true },
    ),
  )

  onCleanup(() => {
    if (refreshTimer !== undefined) window.clearTimeout(refreshTimer)
  })

  return { projectID, artifacts, entries, first, refetch }
}

export function ZingpopPreviewInline() {
  const preview = createZingpopPreviewArtifacts()

  return (
    <Show when={preview.first()}>
      {(artifact) => <ZingpopPreviewBrowserCard artifact={artifact()} />}
    </Show>
  )
}

export function ZingpopPreviewDock() {
  const preview = createZingpopPreviewArtifacts()

  return (
    <Show when={preview.first()}>
      {(artifact) => (
        <div class="mb-2 flex w-full flex-col gap-2 rounded-md border border-border-weak-base bg-background-base px-3 py-2 shadow-sm sm:flex-row sm:items-center">
          <div class="min-w-0 flex-1">
            <div class="text-12-medium text-text-strong">已生成 HTML 作品</div>
            <a
              href={artifact().url}
              target="_blank"
              rel="noopener noreferrer"
              class="block truncate text-12-regular text-text-base hover:text-text-strong"
            >
              {artifact().name}
            </a>
          </div>
          <div class="flex shrink-0 gap-2">
            <Button
              as="a"
              href={artifact().url}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              variant="primary"
              icon="open-file"
            >
              打开预览
            </Button>
            <Button size="small" variant="secondary" icon="copy" onClick={() => copyPreviewArtifact(artifact())}>
              复制链接
            </Button>
          </div>
        </div>
      )}
    </Show>
  )
}

export function ZingpopPreviewPanel() {
  const preview = createZingpopPreviewArtifacts()

  return (
    <Show when={preview.projectID()}>
      <section class="border-b border-border-weaker-base bg-background px-3 py-3">
        <div class="mb-2 flex items-center gap-2">
          <div class="min-w-0 flex-1">
            <div class="text-12-medium text-text-strong">作品预览</div>
            <div class="truncate text-11-regular text-text-weak">生成完成后会自动出现，也可手动刷新</div>
          </div>
          <IconButton icon="reset" size="small" variant="ghost" aria-label="刷新作品预览" onClick={() => preview.refetch()} />
        </div>

        <Switch>
          <Match when={preview.artifacts()?.error}>
            <div class="rounded-md border border-border-base px-2 py-2 text-12-regular text-text-weak">
              {preview.artifacts()!.error}
            </div>
          </Match>
          <Match when={preview.artifacts.loading && !preview.artifacts()}>
            <div class="rounded-md border border-border-base px-2 py-2 text-12-regular text-text-weak">正在查找 HTML 作品...</div>
          </Match>
          <Match when={preview.entries().length === 0}>
            <div class="rounded-md border border-border-base px-2 py-2 text-12-regular text-text-weak">当前项目还没有 HTML 作品</div>
          </Match>
          <Match when={preview.first()}>
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
                  <Button
                    size="small"
                    variant="secondary"
                    icon="copy"
                    class="flex-1"
                    onClick={() => copyPreviewArtifact(artifact())}
                  >
                    复制链接
                  </Button>
                </div>
                <Show when={preview.entries().length > 1}>
                  <div class="max-h-24 overflow-y-auto border-t border-border-weaker-base pt-2">
                    <For each={preview.entries().slice(1)}>
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
