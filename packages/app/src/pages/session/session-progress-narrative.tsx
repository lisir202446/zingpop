import { For, Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js"
import { Collapsible } from "@opencode-ai/ui/collapsible"
import { Icon } from "@opencode-ai/ui/icon"
import type { Message, Part, SessionStatus } from "@opencode-ai/sdk/v2"
import { buildSessionProgressNarrative } from "@/utils/session-progress-narrative"

export function SessionProgressNarrative(props: {
  messageID: string
  messages: readonly Message[]
  parts: Record<string, readonly Part[] | undefined>
  status?: SessionStatus
  waiting?: boolean
}) {
  const [now, setNow] = createSignal(Date.now())
  const [expanded, setExpanded] = createSignal(true)

  createEffect(() => {
    if (props.status?.type !== "busy" && props.status?.type !== "retry" && !props.waiting) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    onCleanup(() => clearInterval(timer))
  })

  const narrative = createMemo(() =>
    buildSessionProgressNarrative({
      messageID: props.messageID,
      messages: props.messages,
      parts: props.parts,
      status: props.status,
      waiting: props.waiting,
      now: now(),
    }),
  )
  const visible = createMemo(() => narrative().busy || narrative().detailCount > 0)
  const statusText = createMemo(() => {
    if (narrative().phase === "error") return "遇到错误"
    if (narrative().phase === "waiting") return "等待确认"
    if (narrative().busy) return "正在处理"
    return "已处理"
  })
  const commandLabel = createMemo(() => {
    if (narrative().detailCount === 0) return
    return narrative().busy ? `已运行 ${narrative().detailCount} 条命令` : `共运行 ${narrative().detailCount} 条命令`
  })

  createEffect(() => {
    if (narrative().busy && !expanded()) setExpanded(true)
  })

  return (
    <Show when={visible()}>
      <section
        data-component="session-progress-narrative"
        aria-live={narrative().busy ? "polite" : "off"}
        aria-busy={narrative().busy}
        class="w-full px-4 pb-3 md:px-5"
      >
        <Collapsible open={expanded()} onOpenChange={setExpanded} class="max-w-[780px] text-text-base">
          <div class="flex flex-wrap items-center gap-2">
            <Collapsible.Trigger
              data-slot="session-progress-narrative-trigger"
              aria-label={expanded() ? "收起处理过程" : "展开处理过程"}
              class="group inline-flex max-w-full items-center gap-1.5 rounded-[10px] border border-border-base bg-background-base px-2.5 py-1 text-12-medium text-text-weak transition-colors hover:border-border-strong hover:text-text-base focus:outline-none focus:ring-2 focus:ring-border-active"
            >
              <span
                class="size-1.5 shrink-0 rounded-full bg-text-weak data-[state=active]:bg-info data-[state=error]:bg-critical"
                data-state={narrative().phase === "error" ? "error" : narrative().busy ? "active" : "complete"}
              />
              <span class="shrink-0">{statusText()}</span>
              <Show when={elapsedLabel(narrative().elapsedMs)}>{(label) => <span class="shrink-0">{label()}</span>}</Show>
              <Show when={commandLabel()}>{(label) => <span class="min-w-0 truncate text-text-muted">{label()}</span>}</Show>
              <Collapsible.Arrow class="ml-0.5 shrink-0 transition-transform group-data-[expanded]:rotate-180" />
            </Collapsible.Trigger>
          </div>

          <Collapsible.Content data-slot="session-progress-narrative-content" class="mt-3 space-y-4">
            <div class="space-y-4" data-slot="session-progress-narrative-events">
              <For each={narrative().events}>
                {(event) => (
                  <div data-slot="session-progress-narrative-event" data-state={event.status} class="space-y-2">
                    <Show when={event.detailCount > 0}>
                      <div class="inline-flex items-center gap-1.5 text-12-regular text-text-weak">
                        <Icon name="terminal" size="small" />
                        <span>
                          {event.status === "active" ? "正在运行" : "已运行"} {event.detailCount} 条命令
                        </span>
                      </div>
                    </Show>
                    <p class="m-0 whitespace-pre-wrap break-words text-14-regular leading-7 text-text-base">
                      {event.text}
                    </p>
                  </div>
                )}
              </For>
            </div>

            <Show when={narrative().todo}>
              {(todo) => (
                <div
                  data-slot="session-progress-narrative-todo"
                  class="max-w-[620px] rounded-[8px] border border-border-weak-base bg-background-panel px-3 py-2.5"
                >
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-13-medium text-text-base">
                    <span>
                      已完成 {todo().done} 个任务（共 {todo().total} 个）
                    </span>
                    <Show when={todo().active}>
                      {(active) => <span class="text-12-regular text-text-weak">当前正在处理：{active()}</span>}
                    </Show>
                  </div>
                  <div class="mt-2 space-y-1.5">
                    <For each={todo().items.slice(0, 8)}>
                      {(item) => (
                        <div class="flex items-start gap-2 text-13-regular leading-5 text-text-base">
                          <span
                            aria-hidden="true"
                            class="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-border-base text-[10px] text-text-weak data-[done=true]:border-success data-[done=true]:bg-success data-[done=true]:text-background-base"
                            data-done={todoDone(item.status)}
                          >
                            <Show when={todoDone(item.status)}>✓</Show>
                          </span>
                          <span
                            class="min-w-0 break-words data-[done=true]:text-text-weak data-[done=true]:line-through"
                            data-done={todoDone(item.status)}
                          >
                            {item.content}
                          </span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </Show>
          </Collapsible.Content>
        </Collapsible>
      </section>
    </Show>
  )
}

function todoDone(status: string) {
  return status === "completed" || status === "cancelled"
}

function elapsedLabel(value: number | undefined) {
  if (typeof value !== "number") return
  const seconds = Math.max(0, Math.floor(value / 1000))
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}
