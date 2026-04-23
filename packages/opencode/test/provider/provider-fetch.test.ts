import { afterEach, expect, test } from "bun:test"
import { AppRuntime } from "../../src/effect/app-runtime"
import { Provider } from "../../src/provider"
import { ModelID, ProviderID } from "../../src/provider/schema"
import { Instance } from "../../src/project/instance"
import { Effect } from "effect"
import { generateText } from "ai"
import path from "path"
import { tmpdir } from "../fixture/fixture"

afterEach(async () => {
  await Instance.disposeAll()
})

test("openai-compatible transport uses the global fetch override", async () => {
  const server = Bun.serve({
    port: 0,
    fetch(request) {
      expect(request.method).toBe("POST")
      expect(new URL(request.url).pathname).toBe("/v1/chat/completions")
      return Response.json({
        id: "chatcmpl_test",
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "test-model",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "OK",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 1,
          completion_tokens: 1,
          total_tokens: 2,
        },
      })
    },
  })

  const baseURL = `http://127.0.0.1:${server.port}/v1`
  await using tmp = await tmpdir({
    init: async (dir) => {
      await Bun.write(
        path.join(dir, "opencode.json"),
        JSON.stringify({
          $schema: "https://opencode.ai/config.json",
          enabled_providers: ["local-openai-compatible"],
          provider: {
            "local-openai-compatible": {
              name: "Local OpenAI Compatible",
              npm: "@ai-sdk/openai-compatible",
              options: {
                apiKey: "test-key",
                baseURL,
              },
              models: {
                "test-model": {
                  name: "Test Model",
                  tool_call: true,
                },
              },
            },
          },
        }),
      )
    },
  })

  const originalFetch = globalThis.fetch
  let calls = 0
  const wrappedFetch = Object.assign(
    (...args: Parameters<typeof fetch>) => {
      if (String(args[0]).startsWith(baseURL)) calls += 1
      return originalFetch(...args)
    },
    {
      preconnect: originalFetch.preconnect,
    },
  ) satisfies typeof fetch
  globalThis.fetch = wrappedFetch

  try {
    const result = await Instance.provide({
      directory: tmp.path,
      fn: async () =>
        AppRuntime.runPromise(
          Effect.gen(function* () {
            const provider = yield* Provider.Service
            const model = yield* provider.getModel(ProviderID.make("local-openai-compatible"), ModelID.make("test-model"))
            const language = yield* provider.getLanguage(model)
            return yield* Effect.promise(() =>
              generateText({
                model: language,
                prompt: "Reply with exactly OK",
                maxRetries: 0,
              }),
            )
          }),
        ),
    })

    expect(result.text).toBe("OK")
    expect(calls).toBeGreaterThan(0)
  } finally {
    globalThis.fetch = originalFetch
    server.stop(true)
  }
}, 30000)
