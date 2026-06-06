import { expect, test } from "bun:test"
import type { Message as MessageType } from "@opencode-ai/sdk/v2/client"
import { assistantMessagesForTurn } from "./session-turn-helpers"

type MinimalMessage = {
  id: string
  role: "user" | "assistant"
  parentID?: string
}

function turnMessages(input: MinimalMessage[]) {
  return input.map((item) => {
    if (item.role === "user") {
      return {
        id: item.id,
        sessionID: "session_1",
        role: "user" as const,
        time: { created: 0 },
        agent: "build",
        model: { providerID: "zai-glm", modelID: "glm-5-turbo" },
      }
    }

    return {
      id: item.id,
      sessionID: "session_1",
      role: "assistant" as const,
      time: { created: 0 },
      parentID: item.parentID,
      modelID: "glm-5-turbo",
      providerID: "zai-glm",
      mode: "build",
      agent: "build",
      path: { cwd: "/workspace", root: "/workspace" },
      cost: 0,
      tokens: {
        input: 0,
        output: 0,
        reasoning: 0,
        cache: { read: 0, write: 0 },
      },
    }
  }) as unknown as MessageType[]
}

test("assistantMessagesForTurn keeps linked assistant messages first", () => {
  expect(
    assistantMessagesForTurn(
      turnMessages([
        { id: "user_1", role: "user" },
        { id: "assistant_1", role: "assistant" },
        { id: "user_2", role: "user" },
        { id: "assistant_2", role: "assistant", parentID: "user_2" },
        { id: "assistant_3", role: "assistant" },
      ]),
      "user_2",
    ).map((message) => message.id),
  ).toEqual(["assistant_2"])
})

test("assistantMessagesForTurn falls back to following assistant messages when linkage is missing", () => {
  expect(
    assistantMessagesForTurn(
      turnMessages([
        { id: "user_1", role: "user" },
        { id: "assistant_1", role: "assistant" },
        { id: "user_2", role: "user" },
        { id: "assistant_2", role: "assistant" },
        { id: "assistant_3", role: "assistant" },
        { id: "user_3", role: "user" },
        { id: "assistant_4", role: "assistant" },
      ]),
      "user_2",
    ).map((message) => message.id),
  ).toEqual(["assistant_2", "assistant_3"])
})

test("assistantMessagesForTurn does not claim assistant messages linked to another turn", () => {
  expect(
    assistantMessagesForTurn(
      turnMessages([
        { id: "user_1", role: "user" },
        { id: "assistant_1", role: "assistant", parentID: "user_1" },
        { id: "user_2", role: "user" },
        { id: "assistant_2", role: "assistant", parentID: "user_4" },
        { id: "assistant_3", role: "assistant" },
        { id: "user_3", role: "user" },
      ]),
      "user_2",
    ).map((message) => message.id),
  ).toEqual(["assistant_3"])
})
