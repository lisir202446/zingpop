import type { AssistantMessage, Message as MessageType } from "@opencode-ai/sdk/v2/client"

export function assistantMessagesForTurn(messages: readonly MessageType[], messageID: string) {
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
