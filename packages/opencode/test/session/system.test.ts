import { describe, expect, test } from "bun:test"
import path from "path"
import { Effect } from "effect"
import { Agent } from "../../src/agent/agent"
import { Instance } from "../../src/project/instance"
import type { Provider } from "../../src/provider"
import { ModelID, ProviderID } from "../../src/provider/schema"
import { SystemPrompt } from "../../src/session/system"
import { provideInstance, tmpdir } from "../fixture/fixture"

function load<A>(dir: string, fn: (svc: Agent.Interface) => Effect.Effect<A>) {
  return Effect.runPromise(provideInstance(dir)(Agent.Service.use(fn)).pipe(Effect.provide(Agent.defaultLayer)))
}

const zaiGlmModel: Provider.Model = {
  id: ModelID.make("glm-5-turbo"),
  providerID: ProviderID.make("zai-glm"),
  api: {
    id: "glm-5-turbo",
    url: "https://open.bigmodel.cn/api/paas/v4",
    npm: "@ai-sdk/openai-compatible",
  },
  name: "GLM 5 Turbo",
  capabilities: {
    temperature: true,
    reasoning: true,
    attachment: false,
    toolcall: true,
    input: {
      text: true,
      audio: false,
      image: false,
      video: false,
      pdf: false,
    },
    output: {
      text: true,
      audio: false,
      image: false,
      video: false,
      pdf: false,
    },
    interleaved: false,
  },
  cost: {
    input: 0,
    output: 0,
    cache: {
      read: 0,
      write: 0,
    },
  },
  limit: {
    context: 128000,
    output: 8192,
  },
  status: "active",
  options: {},
  headers: {},
  release_date: "2026-01-01",
}

describe("session.system", () => {
  test("Zingpop identity prompts use production CN links", async () => {
    const text = (
      await Promise.all(
        [
          "../../src/session/prompt/default.txt",
          "../../src/session/prompt/anthropic.txt",
          "../../src/session/system.ts",
        ].map((file) => Bun.file(new URL(file, import.meta.url)).text()),
      )
    ).join("\n")

    expect(text).not.toContain("https://zingpop.ai")
    expect(text).not.toContain("https://www.zingpop.cn/feishu")
    expect(text).toContain("https://www.zingpop.cn")
    expect(text).toContain("browser-runnable HTML/CSS/JavaScript")
    expect(text).toContain("Zingpop preview panel")
    expect(text).toContain("user-readable progress narrative")
    expect(text).toContain("Do not reveal hidden chain-of-thought")
    expect(text).toContain("brief Chinese progress update")
  })

  test("runtime environment prompt carries Zingpop progress narration rules", async () => {
    await using tmp = await tmpdir({ git: true })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const prompt = await Effect.runPromise(
          Effect.gen(function* () {
            const svc = yield* SystemPrompt.Service
            return svc.environment(zaiGlmModel).join("\n")
          }).pipe(Effect.provide(SystemPrompt.defaultLayer)),
        )

        expect(prompt).toContain("user-readable progress narrative")
        expect(prompt).toContain("brief Chinese progress update")
        expect(prompt).toContain("Do not reveal hidden chain-of-thought")
        expect(prompt).toContain("Zingpop preview panel")
      },
    })
  })

  test("skills output is sorted by name and stable across calls", async () => {
    await using tmp = await tmpdir({
      git: true,
      init: async (dir) => {
        for (const [name, description] of [
          ["zeta-skill", "Zeta skill."],
          ["alpha-skill", "Alpha skill."],
          ["middle-skill", "Middle skill."],
        ]) {
          const skillDir = path.join(dir, ".opencode", "skill", name)
          await Bun.write(
            path.join(skillDir, "SKILL.md"),
            `---
name: ${name}
description: ${description}
---

# ${name}
`,
          )
        }
      },
    })

    const home = process.env.OPENCODE_TEST_HOME
    process.env.OPENCODE_TEST_HOME = tmp.path

    try {
      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const build = await load(tmp.path, (svc) => svc.get("build"))
          const runSkills = Effect.gen(function* () {
            const svc = yield* SystemPrompt.Service
            return yield* svc.skills(build!)
          }).pipe(Effect.provide(SystemPrompt.defaultLayer))

          const first = await Effect.runPromise(runSkills)
          const second = await Effect.runPromise(runSkills)

          expect(first).toBe(second)

          const alpha = first!.indexOf("<name>alpha-skill</name>")
          const middle = first!.indexOf("<name>middle-skill</name>")
          const zeta = first!.indexOf("<name>zeta-skill</name>")

          expect(alpha).toBeGreaterThan(-1)
          expect(middle).toBeGreaterThan(alpha)
          expect(zeta).toBeGreaterThan(middle)
        },
      })
    } finally {
      process.env.OPENCODE_TEST_HOME = home
    }
  })
})
