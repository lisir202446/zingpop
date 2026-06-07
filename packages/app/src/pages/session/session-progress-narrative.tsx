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
  const countText = createMemo(() =>
    [
      countLabel("规划", narrative().counts.planning),
      countLabel("探索", narrative().counts.exploring),
      countLabel("修改", narrative().counts.editing),
      countLabel("验证", narrative().counts.verifying),
      countLabel("等待", narrative().counts.waiting),
    ]
      .filter((item) => item)
      .join(" · "),
  )

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
                data-state={
                  narrative().phase === "error" ? "error" : narrative().busy ? "active" : "complete"
                }
              />
              {statusText()}
              <Show when={elapsedLabel(narrative().elapsedMs)}>{(label) => <span>{label()}</span>}</Show>
            </span>
            <Show when={countText()}>
              {(text) => (
                <span class="text-12-regular text-text-weak" data-slot="session-progress-narrative-counts">
                  {text()}
                </span>
              )}
            </Show>
          </div>

          <div class="space-y-2" data-slot="session-progress-narrative-lines">
            <For each={narrative().lines}>
              {(line) => <p class="m-0 whitespace-pre-wrap break-words text-14-regular leading-7 text-text-base">{line}</p>}
            </For>
          </div>

          <Show when={narrative().detailCount > 0}>
            <div class="inline-flex items-center gap-1.5 text-12-regular text-text-weak">
              <Icon name="chevron-down" size="small" />
              <span>详细执行记录 {narrative().detailCount} 条</span>
            </div>
          </Show>
        </div>
      </section>
    </Show>
  )
}

function countLabel(label: string, count: number) {
  if (count <= 0) return ""
  return `${label} ${count}`
}

function elapsedLabel(value: number | undefined) {
  if (typeof value !== "number") return
  const seconds = Math.max(0, Math.floor(value / 1000))
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}
