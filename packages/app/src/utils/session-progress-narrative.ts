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

export type SessionProgressTodoItem = {
  content: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
}

export type SessionProgressTodo = {
  total: number
  done: number
  active?: string
  items: SessionProgressTodoItem[]
}

export type SessionProgressNarrative = {
  phase: SessionProgressPhase
  busy: boolean
  elapsedMs?: number
  detailCount: number
  events: SessionProgressEvent[]
  lines: string[]
  todo?: SessionProgressTodo
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
  const userRequest = userRequestForProgress(input.parts[input.messageID] ?? [])
  const assistantParts = assistantMessages.flatMap((message) => input.parts[message.id] ?? [])
  const tools = assistantParts.filter((part): part is ToolPart => part.type === "tool")
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
  const elapsed = elapsedMs(
    input.messages.find((message) => message.id === input.messageID),
    assistantMessages,
    busy,
    input.now,
  )
  const events = progressEvents({ phase, parts: assistantParts, request: userRequest, tools, busy, elapsedMs: elapsed })
  const todo = progressTodo(tools)

  return {
    phase,
    busy,
    elapsedMs: elapsed,
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
    todo,
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

function userRequestForProgress(parts: readonly Part[]) {
  const text = parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .replace(/\s+/g, " ")
    .trim()
  if (!text) return
  return text
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
  elapsedMs?: number
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
  if (input.phase === "understanding" && input.busy && (input.elapsedMs ?? 0) >= 15_000) {
    return [
      "模型还在生成执行步骤，我会继续等待它返回可执行动作。",
      "一旦开始读取、修改或验证，我会继续更新当前进展。",
    ]
  }
  return input.busy
    ? [
        "我正在理解你想做的内容，并判断需要产出什么文件或页面。",
        "接下来会先确认项目里是否已有相关文件，再开始创建或修改。",
      ]
    : ["我已收到这条请求，等待开始处理。"]
}

function progressEvents(input: {
  phase: SessionProgressPhase
  parts: readonly Part[]
  request?: string
  tools: readonly ToolPart[]
  busy: boolean
  elapsedMs?: number
}) {
  const events = compactProgressEvents([
    ...progressEventGroups(input.tools).map(
      (group, index): SessionProgressEvent => ({
        id: `${group.key}:${index}:${group.detailCount}`,
        phase: group.phase,
        detailCount: group.detailCount,
        status: groupStatus(group.parts),
        text: progressEventText(group),
      }),
    ),
    ...progressTextEvents(input.parts),
  ]).sort((a, b) => a.detailCount - b.detailCount || a.id.localeCompare(b.id))
  if (input.request && shouldUseProductProcess(input, events)) {
    return compactProgressEvents([
      ...productProcessEvents({
        request: input.request,
        phase: input.phase,
        tools: input.tools,
      }),
      ...events,
    ])
  }
  if (events.length > 0) return events

  return progressLines({
    phase: input.phase,
    tools: input.tools,
    busy: input.busy,
    detailCount: input.tools.length,
    elapsedMs: input.elapsedMs,
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

function shouldUseProductProcess(
  input: {
    request?: string
    tools: readonly ToolPart[]
    busy: boolean
  },
  events: readonly SessionProgressEvent[],
) {
  if (input.tools.length > 0) return isProductRequest(input.request)
  return (
    input.busy &&
    (events.length === 0 || events.length === 1 || events.every((event) => isGenericProductGenerationText(event.text)))
  )
}

function isGenericProductGenerationText(value: string) {
  return value.includes("我正在生成") && value.includes("预览入口")
}

function isProductRequest(value: string | undefined) {
  if (!value) return false
  return /(做|制作|创建|生成|写|搭建|开发|实现).*(小游戏|游戏|工具|页面|网站|网页|HTML|作品|表格|计划|看板|应用|app)|小游戏|游戏|网页|网站|HTML|作品/i.test(
    value,
  )
}

function productProcessEvents(input: {
  request: string
  phase: SessionProgressPhase
  tools: readonly ToolPart[]
}): SessionProgressEvent[] {
  const title = productRequestTitle(input.request)
  const artifact = productArtifactName(input.request)
  const hasTools = input.tools.length > 0
  const hasVerifying = input.tools.some((part) => toolKind(part.tool) === "verifying")
  const complete = input.phase === "complete"

  return [
    {
      id: "product-process:understanding",
      phase: "understanding",
      detailCount: 0,
      status: "done",
      text: `我先把“${title}”理解成一个可以直接体验的作品，而不是只写一段说明。`,
    },
    {
      id: "product-process:planning",
      phase: "planning",
      detailCount: 0,
      status: hasTools ? "done" : "active",
      text: `接下来会拆清楚玩法目标和核心结构：用户要做什么、页面上需要哪些区域、交互如何开始和结束。`,
    },
    {
      id: "product-process:editing",
      phase: "editing",
      detailCount: 0,
      status: complete || hasVerifying ? "done" : "active",
      text: `然后我会把 ${artifact} 写成可运行的 HTML 作品，补上界面、交互逻辑、状态变化和基础视觉表现。`,
    },
    {
      id: "product-process:verifying",
      phase: "verifying",
      detailCount: 0,
      status: complete ? "done" : "active",
      text: "最后会准备预览入口，让你能直接打开检查，而不是只看到一段完成描述。",
    },
  ]
}

function productRequestTitle(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 42)
}

function productArtifactName(value: string) {
  if (/枪战|射击|小游戏|游戏/.test(value)) return "这个小游戏"
  if (/网站|主页|页面|官网|landing/i.test(value)) return "这个页面"
  if (/工具|计算器|表格|生成器/.test(value)) return "这个工具"
  return "这个作品"
}

function compactProgressEvents(events: readonly SessionProgressEvent[]) {
  return events.filter(
    (event, index) =>
      event.text.trim().length > 0 &&
      events.findIndex((item) => item.text === event.text && item.detailCount === event.detailCount) === index,
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
    return `我已经检查了${target ? ` ${target}` : "项目里的相关文件和上下文"}，确认下一步该改哪里。`
  }
  if (group.key === "editing") {
    if (active) return `我正在更新${target ? ` ${target}` : "目标文件"}，把需求落到可以运行的页面里。`
    return `我已经更新了${target ? ` ${target}` : "目标文件"}，主要内容已经写入。`
  }
  if (group.key === "recovery") {
    if (active) return `写入${target ? ` ${target} 时` : "文件时"}遇到格式限制，我正在改用更稳定的方式继续生成。`
    return `写入${target ? ` ${target} 时` : "文件时"}遇到格式限制，我已经换成更稳定的方式继续生成。`
  }
  if (group.key === "verifying") {
    if (active) return "我正在运行检查，确认生成结果能正常打开。"
    return "我已经运行检查，确认生成结果可以继续验收。"
  }
  if (group.key === "waiting") return "我正在等待确认信息，确认后会继续执行后续步骤。"
  if (group.key === "error") return "执行时遇到一个底层限制，我正在调整方法继续处理。"
  return "我正在继续处理这一轮任务。"
}

function progressTextEvents(parts: readonly Part[]) {
  const result = parts.reduce<{ events: SessionProgressEvent[]; toolCount: number }>(
    (state, part, index) => {
      if (part.type === "tool") {
        return {
          events: state.events,
          toolCount: state.toolCount + 1,
        }
      }
      if (part.type !== "text") return state

      const text = progressTextNarrative(part.text)
      if (!text) return state

      return {
        events: [
          ...state.events,
          {
            id: `text:${index}:${state.toolCount}`,
            phase: progressTextPhase(text),
            detailCount: state.toolCount,
            status: "done",
            text,
          },
        ],
        toolCount: state.toolCount,
      }
    },
    { events: [], toolCount: 0 },
  )

  return result.events
}

function progressTextNarrative(text: string) {
  const value = text.trim()
  const lower = value.toLowerCase()
  if (!value || isCompletionProcessText(value) || isRawToolSummaryText(lower)) return

  const target = htmlTargetName(value)
  const targetSuffix = target ? ` ${target}` : ""

  if (/remaining sections|final javascript|insert.*<\/body>|add.*javascript/i.test(value)) {
    return `我正在补充${targetSuffix || "页面"}剩余内容和交互脚本，把作品写完整。`
  }
  if (/write.*chunks|single write|file is too large|bash to create|avoid json/i.test(value)) {
    return `文件内容较大，我正在改用更稳定的分段写入方式继续生成。`
  }
  if (isRawProcessText(lower)) return
  if (/understand.*structure|existing component|look at.*files|key files|inspect/i.test(value)) {
    return "我正在查看关键文件和现有结构，确认改动位置。"
  }
  if (/sound effects?|game events?|audio context|resume call/i.test(value)) {
    return "我正在把音效接入到对应的事件里，并处理浏览器音频启用限制。"
  }
  if (/test|verify|check|validate/i.test(value)) {
    return "我正在运行验证，确认生成结果可以稳定使用。"
  }
  if (/plan|steps|todo/i.test(value)) {
    return "我正在把需求拆成可执行步骤，按顺序推进。"
  }
  if (/我.*(找到|定位|确认|排查|来源|根因)/.test(value)) {
    return "我已经定位到问题来源，正在按影响范围调整实现。"
  }
  if (/(测试|验证|检查|复现|证明)/.test(value)) {
    return "我正在补上验证，确认这个行为不会再复现。"
  }
  if (/(修改|修复|调整|实现|改到|补充)/.test(value)) {
    return "我正在把改动落到产品界面，并检查不会影响底层运行路径。"
  }
  if (/(写入|生成|创建)/.test(value)) {
    return `我正在生成${targetSuffix || "作品"}内容，并准备可打开的预览入口。`
  }
}

function progressTextPhase(text: string): SessionProgressPhase {
  if (/(验证|检查|稳定使用|复现)/.test(text)) return "verifying"
  if (/(补充|生成|写完整|写入|实现|修复|调整)/.test(text)) return "editing"
  if (/(查看|定位|来源|结构|关键文件)/.test(text)) return "exploring"
  if (/(拆成|步骤)/.test(text)) return "planning"
  return "understanding"
}

function isCompletionProcessText(value: string) {
  if (/^(done|completed|finished|ready)\b/i.test(value)) return true
  return /(已|已经)?(完成|创建完成|创建完毕|生成完成|修好|处理完|准备好)/.test(value) || /可以.*(预览|打开|查看|验收)/.test(value)
}

function isRawProcessText(lower: string) {
  return (
    lower.includes("json parsing") ||
    lower.includes("invalid input for tool") ||
    lower.includes("filepath") ||
    lower.includes("cat >") ||
    lower.includes("bun test") ||
    lower.includes("error=") ||
    lower.includes("command=")
  )
}

function isRawToolSummaryText(lower: string) {
  return /^调用了\s+[`'"]?\w+[`'"]?/i.test(lower)
}

function htmlTargetName(value: string) {
  const target = value.match(/([^\s"'`<>|&;：，。！？；、]+?\.(?:html|htm))/i)?.[1]
  return target ? basename(target) : undefined
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

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function todoStatus(value: unknown): SessionProgressTodoItem["status"] | undefined {
  if (value === "pending" || value === "in_progress" || value === "completed" || value === "cancelled") return value
}

function todoItem(value: unknown): SessionProgressTodoItem | undefined {
  if (!record(value)) return
  if (typeof value.content !== "string" || value.content.trim().length === 0) return
  const status = todoStatus(value.status)
  if (!status) return
  return {
    content: value.content.trim(),
    status,
  }
}

function todoItems(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(todoItem).filter((item): item is SessionProgressTodoItem => !!item)
}

function progressTodo(tools: readonly ToolPart[]): SessionProgressTodo | undefined {
  const items = tools
    .filter((part) => part.tool === "todowrite")
    .map((part) => {
      const metadata = "metadata" in part.state && record(part.state.metadata) ? part.state.metadata.todos : undefined
      const fromMetadata = todoItems(metadata)
      if (fromMetadata.length > 0) return fromMetadata
      return todoItems(part.state.input.todos)
    })
    .findLast((list) => list.length > 0)

  if (!items) return

  return {
    total: items.length,
    done: items.filter((item) => item.status === "completed" || item.status === "cancelled").length,
    active:
      items.find((item) => item.status === "in_progress")?.content ??
      items.find((item) => item.status === "pending")?.content,
    items,
  }
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
