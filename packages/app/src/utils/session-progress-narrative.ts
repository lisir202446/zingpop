import type { AssistantMessage, Message, Part, SessionStatus, ToolPart } from "@opencode-ai/sdk/v2"

export type SessionProgressPhase =
  | "understanding"
  | "planning"
  | "exploring"
  | "editing"
  | "verifying"
  | "waiting"
  | "error"
  | "complete"

export type SessionProgressNarrative = {
  phase: SessionProgressPhase
  busy: boolean
  elapsedMs?: number
  detailCount: number
  lines: string[]
  counts: {
    planning: number
    exploring: number
    editing: number
    verifying: number
    waiting: number
  }
}

export function buildSessionProgressNarrative(input: {
  messageID: string
  messages: readonly Message[]
  parts: Record<string, readonly Part[] | undefined>
  status?: SessionStatus
  waiting?: boolean
  now?: number
}): SessionProgressNarrative {
  const assistantMessages = assistantMessagesForProgress(input.messages, input.messageID)
  const tools = assistantMessages.flatMap((message) =>
    (input.parts[message.id] ?? []).filter((part): part is ToolPart => part.type === "tool"),
  )
  const busy = input.status?.type === "busy" || input.status?.type === "retry" || input.waiting === true
  const running = tools.findLast((part) => part.state.status === "pending" || part.state.status === "running")
  const errored = tools.findLast((part) => part.state.status === "error")
  const active = errored ?? running ?? tools.at(-1)
  const phase = progressPhase({ active, busy, errored, waiting: input.waiting === true, toolCount: tools.length })
  const target = active ? toolTarget(active) : undefined
  const waitingCount = countTools(tools, "waiting")

  return {
    phase,
    busy,
    elapsedMs: elapsedMs(input.messages.find((message) => message.id === input.messageID), assistantMessages, busy, input.now),
    detailCount: tools.length,
    counts: {
      planning: countTools(tools, "planning"),
      exploring: countTools(tools, "exploring"),
      editing: countTools(tools, "editing"),
      verifying: countTools(tools, "verifying"),
      waiting: input.waiting ? Math.max(waitingCount, 1) : waitingCount,
    },
    lines: progressLines({ phase, target, tool: active?.tool, busy, detailCount: tools.length }),
  }
}

function assistantMessagesForProgress(messages: readonly Message[], messageID: string) {
  const linked = messages.filter(
    (item): item is AssistantMessage => item.role === "assistant" && item.parentID === messageID,
  )
  if (linked.length > 0) return linked

  const turnStart = messages.findIndex((item) => item.id === messageID && item.role === "user")
  if (turnStart === -1) return []

  const candidates = messages.slice(turnStart + 1)
  const nextUser = candidates.findIndex((item) => item.role === "user")
  return candidates
    .slice(0, nextUser === -1 ? undefined : nextUser)
    .filter(
      (item): item is AssistantMessage => item.role === "assistant" && (!item.parentID || item.parentID === messageID),
    )
}

function toolKind(tool: string) {
  if (tool === "todowrite") return "planning"
  if (tool === "read" || tool === "list" || tool === "glob" || tool === "grep") return "exploring"
  if (tool === "write" || tool === "edit" || tool === "apply_patch") return "editing"
  if (tool === "bash") return "verifying"
  if (tool === "question") return "waiting"
  return "exploring"
}

function countTools(tools: readonly ToolPart[], kind: ReturnType<typeof toolKind>) {
  return tools.filter((part) => toolKind(part.tool) === kind).length
}

function progressPhase(input: {
  active?: ToolPart
  busy: boolean
  errored?: ToolPart
  waiting: boolean
  toolCount: number
}): SessionProgressPhase {
  if (input.errored) return "error"
  if (input.waiting) return "waiting"
  if (input.toolCount > 0 && !input.busy) return "complete"
  if (input.active) return toolKind(input.active.tool)
  return "understanding"
}

function progressLines(input: {
  phase: SessionProgressPhase
  target?: string
  tool?: string
  busy: boolean
  detailCount: number
}) {
  if (input.phase === "error") {
    return [`遇到错误：${input.tool ? describeTool(input.tool, input.target) : "执行过程失败"}。可以展开详细执行记录查看原始输出。`]
  }
  if (input.phase === "planning") {
    return ["我正在把需求拆成可执行步骤，先确认任务顺序和当前要处理的重点。"]
  }
  if (input.phase === "exploring") {
    return [`我正在检查${input.target ? ` ${input.target} ` : "项目上下文"}，先确认应该在哪里改，避免误动无关文件。`]
  }
  if (input.phase === "editing") {
    return [`我正在修改${input.target ? ` ${input.target}` : "相关文件"}，把当前需求落到实际实现里。`]
  }
  if (input.phase === "verifying") {
    return [`我正在运行${input.target ? ` ${input.target}` : "验证命令"}，确认这次改动能正常工作。`]
  }
  if (input.phase === "waiting") {
    return ["我正在等待确认信息，确认后会继续执行后续步骤。"]
  }
  if (input.phase === "complete") {
    return [`本轮工作已完成，保留了 ${input.detailCount} 条详细执行记录，可展开核查原始工具输出。`]
  }
  return [input.busy ? "我正在理解你的需求，并准备把它拆成可以执行的工作步骤。" : "我已收到这条请求，等待开始处理。"]
}

function describeTool(tool: string, target?: string) {
  if (tool === "bash") return target ? `运行 ${target} 时失败` : "运行命令时失败"
  if (tool === "write" || tool === "edit" || tool === "apply_patch") return target ? `修改 ${target} 时失败` : "修改文件时失败"
  if (tool === "read" || tool === "list" || tool === "glob" || tool === "grep") return target ? `检查 ${target} 时失败` : "检查项目上下文时失败"
  return target ? `${tool} ${target} 失败` : `${tool} 失败`
}

function toolTarget(part: ToolPart) {
  return shortTarget(firstString(part.state.input, ["filePath", "path", "command", "pattern", "query", "description"]))
}

function firstString(input: Record<string, unknown>, keys: readonly string[]) {
  return keys.map((key) => input[key]).find((value): value is string => typeof value === "string" && value.length > 0)
}

function shortTarget(value: string | undefined) {
  if (!value) return
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= 140) return normalized
  return `${normalized.slice(0, 137)}...`
}

function elapsedMs(
  message: Message | undefined,
  assistantMessages: readonly AssistantMessage[],
  busy: boolean,
  now?: number,
) {
  if (!message) return
  if (!("time" in message) || typeof message.time?.created !== "number") return
  const end = busy
    ? typeof now === "number"
      ? now
      : undefined
    : assistantMessages.reduce<number | undefined>((latest, item) => {
        if (typeof item.time.completed !== "number") return latest
        if (latest === undefined) return item.time.completed
        return Math.max(latest, item.time.completed)
      }, undefined)
  if (typeof end !== "number") return
  if (end < message.time.created) return
  return end - message.time.created
}
