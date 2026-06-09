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
  if (/^(now|let me|i need to|i'll|i will|i can|let's|next,?\s*i|the file is too large|this file is too large)\b/i.test(value)) {
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

function userFacingText(items: readonly MessagePartRef[]) {
  return items.filter(hasUserText).filter((item) => item.part.type === "text" && !isProgressText(item.part.text))
}

export function userFacingTextPartKeys(items: readonly MessagePartRef[]) {
  const lastToolIndex = items.findLastIndex((item) => item.part.type === "tool")
  const visible = lastToolIndex === -1 ? userFacingText(items).slice(-1) : userFacingText(items.slice(lastToolIndex + 1))

  return new Set(visible.map((item) => `${item.messageID}:${item.part.id}`))
}
