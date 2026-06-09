import { For, Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js"
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

  return (
    <Show when={visible()}>
      <section data-component="session-progress-narrative" class="w-full px-4 md:px-5 pb-3">
        <div class="max-w-[780px] space-y-3 text-text-base">
          <div class="flex flex-wrap items-center gap-2">
            <span
              data-slot="session-progress-narrative-status"
              class="inline-flex items-center gap-1.5 rounded-[10px] border border-border-base bg-background-base px-2.5 py-1 text-12-medium text-text-weak"
            >
              <span
                class="size-1.5 rounded-full bg-text-weak data-[state=active]:bg-info data-[state=error]:bg-critical"
                data-state={narrative().phase === "error" ? "error" : narrative().busy ? "active" : "complete"}
              />
              {statusText()}
              <Show when={elapsedLabel(narrative().elapsedMs)}>{(label) => <span>{label()}</span>}</Show>
            </span>
          </div>

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
        </div>
      </section>
    </Show>
  )
}

function elapsedLabel(value: number | undefined) {
  if (typeof value !== "number") return
  const seconds = Math.max(0, Math.floor(value / 1000))
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}
