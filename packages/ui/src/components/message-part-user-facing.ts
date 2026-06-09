import type { Part as PartType } from "@opencode-ai/sdk/v2"

type MessagePartRef = {
  messageID: string
  part: PartType
}

function hasUserText(item: MessagePartRef) {
  return item.part.type === "text" && !!item.part.text?.trim()
}

function isProgressText(text: string) {
  const value = text.trim()
  const lower = value.toLowerCase()
  if (!value) return true
  if (isCompletionText(value)) return false
  if (/^(now|let me|i need to|i'll|i will|i can|let's|next,?\s*i|the file is too large|this file is too large)\b/i.test(value)) {
    return true
  }
  if (/^(我(正在|会|将|先|需要|找到|定位|检查|确认|准备|继续)|正在|接下来|下一步|已定位到|写入方式受限|文件太大|现在)/.test(value)) {
    return true
  }
  if (/^调用了\s+[`'"]?\w+[`'"]?/.test(value) && /\b(filePath|path|command|error|input|output|tool)=/i.test(value)) {
    return true
  }
  return (
    lower.includes("json parsing") ||
    lower.includes("invalid input for tool") ||
    lower.includes("tool write") ||
    lower.includes("cat >") ||
    lower.includes("bun test") ||
    lower.includes("bash to create")
  )
}

function isCompletionText(text: string) {
  if (/^(我(正在|会|将|先|需要|准备|继续)|正在|接下来|下一步)/.test(text)) return false
  return (
    /(已|已经)?(完成|创建完成|创建完毕|生成完成|修好|处理完|准备好)/.test(text) ||
    /可以.*(预览|打开|查看|验收)/.test(text) ||
    /即可(查看|打开|验收)/.test(text) ||
    /^(done|completed|finished|ready)\b/i.test(text)
  )
}

function isImplementationProgressText(text: string) {
  const value = text.trim()
  return (
    /^(i found|i located|i identified|i confirmed|i traced|i checked)\b/i.test(value) &&
    /\b(root cause|issue|problem|packages\/|src\/|fallback|implementation|file|command|tool|test|build)\b/i.test(value)
  )
}

function lastToolIndex(items: readonly MessagePartRef[]) {
  return items.reduce((last, item, index) => (item.part.type === "tool" ? index : last), -1)
}

function userFacingText(items: readonly MessagePartRef[], hideImplementationProgress = false) {
  return items
    .filter(hasUserText)
    .filter(
      (item) =>
        item.part.type === "text" &&
        !isProgressText(item.part.text) &&
        (!hideImplementationProgress || !isImplementationProgressText(item.part.text)),
    )
}

export function userFacingTextPartKeys(items: readonly MessagePartRef[]) {
  const hasTools = items.some((item) => item.part.type === "tool")
  const visible =
    !hasTools ? userFacingText(items).slice(-1) : userFacingText(items.slice(lastToolIndex(items) + 1), true)

  return new Set(visible.map((item) => `${item.messageID}:${item.part.id}`))
}
