import type { Part as PartType } from "@opencode-ai/sdk/v2"

type MessagePartRef = {
  messageID: string
  part: PartType
}

function hasUserText(item: MessagePartRef) {
  return item.part.type === "text" && !!item.part.text?.trim()
}

export function userFacingTextPartKeys(items: readonly MessagePartRef[]) {
  const lastToolIndex = items.findLastIndex((item) => item.part.type === "tool")
  const visible =
    lastToolIndex === -1 ? items.filter(hasUserText).slice(-1) : items.slice(lastToolIndex + 1).filter(hasUserText)

  return new Set(visible.map((item) => `${item.messageID}:${item.part.id}`))
}
