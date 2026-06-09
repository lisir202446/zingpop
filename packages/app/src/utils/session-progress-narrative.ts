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

export type SessionProgressEvent = {
  id: string
  phase: SessionProgressPhase
  detailCount: number
  status: "done" | "active" | "error"
  text: string
}

export type SessionProgressNarrative = {
  phase: SessionProgressPhase
  busy: boolean
  elapsedMs?: number
  detailCount: number
  events: SessionProgressEvent[]
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
  const latest = tools.at(-1)
  const blockingError = errored && !busy && latest?.state.status === "error" ? errored : undefined
  const active = blockingError ?? running ?? latest ?? errored
  const phase = progressPhase({
    active,
    busy,
    errored: blockingError,
    waiting: input.waiting === true,
    toolCount: tools.length,
  })
  const waitingCount = countTools(tools, "waiting")
  const events = progressEvents({ phase, tools, busy })

  return {
    phase,
    busy,
    elapsedMs: elapsedMs(
      input.messages.find((message) => message.id === input.messageID),
      assistantMessages,
      busy,
      input.now,
    ),
    detailCount: tools.length,
    counts: {
      planning: countTools(tools, "planning"),
      exploring: countTools(tools, "exploring"),
      editing: countTools(tools, "editing"),
      verifying: countTools(tools, "verifying"),
      waiting: input.waiting ? Math.max(waitingCount, 1) : waitingCount,
    },
    events,
    lines: events.map((event) => event.text),
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
  tools: readonly ToolPart[]
  busy: boolean
  detailCount: number
}) {
  const recent = compactLines(input.tools.flatMap(userFacingToolLine)).slice(-4)
  if (input.phase === "error") {
    return [
      `遇到错误：${input.tool ? describeTool(input.tool, input.target) : "执行过程失败"}。我会调整处理方式继续推进。`,
    ]
  }
  if (recent.length > 0 && input.phase !== "complete") {
    return recent
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
    return [`本轮工作已完成，共推进了 ${input.detailCount} 个执行步骤。`, ...recent].filter((line) => line.length > 0)
  }
  return input.busy
    ? [
        "我正在理解你想做的内容，并判断需要产出什么文件或页面。",
        "接下来会先确认项目里是否已有相关文件，再开始创建或修改。",
      ]
    : ["我已收到这条请求，等待开始处理。"]
}

function progressEvents(input: { phase: SessionProgressPhase; tools: readonly ToolPart[]; busy: boolean }) {
  const events = progressEventGroups(input.tools).map(
    (group, index): SessionProgressEvent => ({
      id: `${group.key}:${index}:${group.detailCount}`,
      phase: group.phase,
      detailCount: group.detailCount,
      status: groupStatus(group.parts),
      text: progressEventText(group),
    }),
  )
  if (events.length > 0) return events

  return progressLines({
    phase: input.phase,
    tools: input.tools,
    busy: input.busy,
    detailCount: input.tools.length,
  }).map(
    (text, index): SessionProgressEvent => ({
      id: `empty:${input.phase}:${index}`,
      phase: input.phase,
      detailCount: 0,
      status: input.busy ? "active" : "done",
      text,
    }),
  )
}

type ProgressEventGroup = {
  key: string
  phase: SessionProgressPhase
  detailCount: number
  parts: ToolPart[]
}

function progressEventGroups(tools: readonly ToolPart[]) {
  return tools.reduce<ProgressEventGroup[]>((result, part, index) => {
    const key = toolEventGroupKey(part)
    const previous = result.at(-1)
    if (previous?.key === key) {
      return [
        ...result.slice(0, -1),
        {
          ...previous,
          detailCount: index + 1,
          parts: [...previous.parts, part],
        },
      ]
    }

    return [
      ...result,
      {
        key,
        phase: progressEventPhase(key, part),
        detailCount: index + 1,
        parts: [part],
      },
    ]
  }, [])
}

function toolEventGroupKey(part: ToolPart) {
  if (part.state.status === "error" && !isRecoverableWriteFormatError(part)) return "error"
  if (isRecoverableWriteFormatError(part) || commandWritesFile(part)) return "recovery"
  return toolKind(part.tool)
}

function progressEventPhase(key: string, part: ToolPart): SessionProgressPhase {
  if (key === "recovery") return "editing"
  if (part.state.status === "error" && !isRecoverableWriteFormatError(part)) return "error"
  return toolKind(part.tool)
}

function groupStatus(parts: readonly ToolPart[]): SessionProgressEvent["status"] {
  if (parts.some((part) => part.state.status === "error" && !isRecoverableWriteFormatError(part))) return "error"
  if (parts.some((part) => part.state.status === "pending" || part.state.status === "running")) return "active"
  return "done"
}

function progressEventText(group: ProgressEventGroup) {
  const target = progressTargetName(group.parts)
  const active = groupStatus(group.parts) === "active"

  if (group.key === "planning") return "我已经把任务拆成步骤，正在按顺序推进。"
  if (group.key === "exploring") {
    if (active) return "我正在检查项目上下文，确认应该在哪些文件里修改。"
    return `我已经检查了${target ? ` ${target} ` : "项目里的相关文件和上下文"}，确认下一步该改哪里。`
  }
  if (group.key === "editing") {
    if (active) return `我正在更新${target ? ` ${target}` : "目标文件"}，把需求落到可以运行的页面里。`
    return `我已经更新了${target ? ` ${target}` : "目标文件"}，主要内容已经写入。`
  }
  if (group.key === "recovery") {
    if (active) return `写入${target ? ` ${target} ` : "文件"}时遇到格式限制，我正在改用更稳定的方式继续生成。`
    return `写入${target ? ` ${target} ` : "文件"}时遇到格式限制，我已经换成更稳定的方式继续生成。`
  }
  if (group.key === "verifying") {
    if (active) return "我正在运行检查，确认生成结果能正常打开。"
    return "我已经运行检查，确认生成结果可以继续验收。"
  }
  if (group.key === "waiting") return "我正在等待确认信息，确认后会继续执行后续步骤。"
  if (group.key === "error") return "执行时遇到一个底层限制，我正在调整方法继续处理。"
  return "我正在继续处理这一轮任务。"
}

function describeTool(tool: string, target?: string) {
  if (tool === "bash") return target ? `运行 ${target} 时失败` : "运行命令时失败"
  if (tool === "write" || tool === "edit" || tool === "apply_patch")
    return target ? `修改 ${target} 时失败` : "修改文件时失败"
  if (tool === "read" || tool === "list" || tool === "glob" || tool === "grep")
    return target ? `检查 ${target} 时失败` : "检查项目上下文时失败"
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

function compactLines(lines: readonly string[]) {
  return lines.filter((line, index) => line && lines.indexOf(line) === index)
}

function progressTargetName(parts: readonly ToolPart[]) {
  return (
    parts.map(fileTargetName).findLast((value) => value && /\.(html|htm)\b/i.test(value)) ??
    parts.map(fileTargetName).findLast(Boolean)
  )
}

function fileTargetName(part: ToolPart) {
  const direct = firstString(part.state.input, ["filePath", "path"])
  if (direct) return basename(direct)

  const command = firstString(part.state.input, ["command"])
  const html = command?.match(/([^\s"'`<>|&;]+?\.(?:html|htm))/i)?.[1]
  if (html) return basename(html)

  return toolTargetName(part)
}

function basename(value: string) {
  return value.replace(/^.*[\\/]/, "").replace(/[),.;:，。；：]+$/, "")
}

function inputText(part: ToolPart) {
  const values = [
    ...["filePath", "path", "command", "pattern", "query", "description", "error", "tool"]
      .map((key) => part.state.input[key])
      .filter((value): value is string => typeof value === "string" && value.length > 0),
    part.state.status === "error" ? part.state.error : undefined,
    part.state.status === "completed" ? part.state.title : undefined,
  ]
  return values.filter((value): value is string => !!value).join(" ")
}

function isRecoverableWriteFormatError(part: ToolPart) {
  const text = inputText(part).toLowerCase()
  return (
    (part.tool === "invalid" || part.state.status === "error") &&
    text.includes("write") &&
    (text.includes("json parsing") || text.includes("invalid input"))
  )
}

function commandWritesFile(part: ToolPart) {
  if (part.tool !== "bash") return
  const command = firstString(part.state.input, ["command"])
  if (!command) return
  return />\s*[^"'`\s]+|cat\s+>|tee\s+/.test(command)
}

function toolTargetName(part: ToolPart) {
  const target = toolTarget(part)
  if (!target) return
  return target.replace(/^.*[\\/]/, "")
}

function userFacingToolLine(part: ToolPart) {
  const target = toolTargetName(part)
  if (isRecoverableWriteFormatError(part)) {
    return ["写入文件时遇到内容格式限制，我正在换一种方式，用更稳定的写入流程继续生成。"]
  }
  if (part.state.status === "error") return ["执行时遇到一个底层限制，我正在调整方法继续处理。"]
  if (part.tool === "todowrite") return ["我已经把任务拆成步骤，正在按顺序推进。"]
  if (part.tool === "read" || part.tool === "list" || part.tool === "glob" || part.tool === "grep") {
    if (part.state.status === "completed") return ["我已经检查了项目里的相关文件和上下文。"]
    return ["我正在查看项目里的相关文件，确认应该在哪里动手。"]
  }
  if (part.tool === "write") {
    if (part.state.status === "completed") return [`我已经创建了${target ? ` ${target}` : "目标文件"}。`]
    return [`我正在创建${target ? ` ${target}` : "目标文件"}。`]
  }
  if (part.tool === "edit" || part.tool === "apply_patch") {
    if (part.state.status === "completed") return [`我已经更新了${target ? ` ${target}` : "相关文件"}。`]
    return [`我正在补充${target ? ` ${target}` : "相关文件"}的内容和交互。`]
  }
  if (commandWritesFile(part)) {
    if (part.state.status === "completed") return ["我已经用更稳定的写入方式生成了文件内容。"]
    return ["我正在用更稳定的写入方式生成文件内容。"]
  }
  if (part.tool === "bash") {
    const command = toolTarget(part)
    if (part.state.status === "completed") {
      return [
        command
          ? `我已经运行检查（${command}），确认生成结果可以继续验收。`
          : "我已经运行了一轮检查，确认生成结果可以继续验收。",
      ]
    }
    return [
      command ? `我正在运行检查（${command}），确认生成结果能正常打开。` : "我正在运行检查，确认生成结果能正常打开。",
    ]
  }
  if (part.tool === "question") return ["我正在等待确认信息，确认后会继续执行后续步骤。"]
  return []
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
