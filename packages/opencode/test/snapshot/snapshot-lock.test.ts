import { afterEach, expect, test } from "bun:test"
import { $ } from "bun"
import fs from "fs/promises"
import path from "path"
import { Effect } from "effect"
import { Hash } from "@opencode-ai/shared/util/hash"
import { Snapshot } from "../../src/snapshot"
import { Global } from "../../src/global"
import { Instance } from "../../src/project/instance"
import { Filesystem } from "../../src/util"
import { provideInstance, tmpdir } from "../fixture/fixture"

afterEach(async () => {
  await Instance.disposeAll()
})

function run<A>(dir: string, body: (snapshot: Snapshot.Interface) => Effect.Effect<A>) {
  return Effect.runPromise(
    Effect.gen(function* () {
      const snapshot = yield* Snapshot.Service
      return yield* body(snapshot)
    }).pipe(provideInstance(dir), Effect.provide(Snapshot.defaultLayer)),
  )
}

test("recovers from a stale snapshot index.lock", async () => {
  await using tmp = await tmpdir({
    git: true,
    init: async (dir) => {
      await Filesystem.write(`${dir}/a.txt`, "A")
      await $`git add .`.cwd(dir).quiet()
      await $`git commit -m init`.cwd(dir).quiet()
    },
  })

  await Instance.provide({
    directory: tmp.path,
    fn: async () => {
      const before = await run(tmp.path, (snapshot) => snapshot.track())
      expect(before).toBeTruthy()

      const gitdir = path.join(Global.Path.data, "snapshot", Instance.project.id, Hash.fast(Instance.worktree))
      await fs.mkdir(gitdir, { recursive: true })
      await fs.writeFile(path.join(gitdir, "index.lock"), "")

      await Filesystem.write(`${tmp.path}/a.txt`, "B")

      const after = await run(tmp.path, (snapshot) => snapshot.track())
      expect(after).toBeTruthy()
      expect(after).not.toBe(before)

      expect(
        await fs
          .access(path.join(gitdir, "index.lock"))
          .then(() => true)
          .catch(() => false),
      ).toBe(false)
    },
  })
}, 60000)
