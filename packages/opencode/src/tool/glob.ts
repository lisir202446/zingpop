import path from "path"
import z from "zod"
import { Effect, Exit, Option } from "effect"
import * as Stream from "effect/Stream"
import { Glob } from "@opencode-ai/shared/util/glob"
import { InstanceState } from "@/effect"
import { AppFileSystem } from "@opencode-ai/shared/filesystem"
import { Ripgrep } from "../file/ripgrep"
import { assertExternalDirectoryEffect } from "./external-directory"
import DESCRIPTION from "./glob.txt"
import * as Tool from "./tool"

export const GlobTool = Tool.define(
  "glob",
  Effect.gen(function* () {
    const rg = yield* Ripgrep.Service
    const fs = yield* AppFileSystem.Service
    type FileEntry = { path: string; mtime: number }

    return {
      description: DESCRIPTION,
      parameters: z.object({
        pattern: z.string().describe("The glob pattern to match files against"),
        path: z
          .string()
          .optional()
          .describe(
            `The directory to search in. If not specified, the current working directory will be used. IMPORTANT: Omit this field to use the default directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a valid directory path if provided.`,
          ),
      }),
      execute: (params: { pattern: string; path?: string }, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const ins = yield* InstanceState.context
          yield* ctx.ask({
            permission: "glob",
            patterns: [params.pattern],
            always: ["*"],
            metadata: {
              pattern: params.pattern,
              path: params.path,
            },
          })

          let search = params.path ?? ins.directory
          search = path.isAbsolute(search) ? search : path.resolve(ins.directory, search)
          const info = yield* fs.stat(search).pipe(Effect.catch(() => Effect.succeed(undefined)))
          if (info?.type === "File") {
            throw new Error(`glob path must be a directory: ${search}`)
          }
          yield* assertExternalDirectoryEffect(ctx, search, { kind: "directory" })

          const limit = 100
          let truncated = false
          const stat = (file: string) =>
            Effect.gen(function* () {
              const full = path.normalize(file)
              const info = yield* fs.stat(full).pipe(Effect.catch(() => Effect.succeed(undefined)))
              const mtime =
                info?.mtime.pipe(
                  Option.map((date) => date.getTime()),
                  Option.getOrElse(() => 0),
                ) ?? 0
              return { path: full, mtime }
            })
          const collect = <E, R>(stream: Stream.Stream<string, E, R>): Effect.Effect<FileEntry[], E, R> =>
            stream.pipe(
              Stream.mapEffect(stat),
              Stream.take(limit + 1),
              Stream.runCollect,
              Effect.map((chunk): FileEntry[] => Array.from(chunk)),
            )
          const fallback = Effect.tryPromise({
            try: () => Glob.scan(params.pattern, { cwd: search, absolute: true, dot: true }),
            catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
          }).pipe(
            Effect.map((files) => files.filter((file) => !path.normalize(file).split(path.sep).includes(".git"))),
            Effect.flatMap((files) => collect(Stream.fromIterable(files))),
          )
          const exit = yield* collect(
            rg.files({ cwd: search, glob: [params.pattern], signal: ctx.abort }).pipe(
              Stream.map((file) => path.resolve(search, file)),
              Stream.filter((file) => !path.normalize(file).split(path.sep).includes(".git")),
            ),
          ).pipe(
            Effect.timeoutOrElse({ duration: "2 seconds", orElse: () => fallback }),
            Effect.exit,
          )
          const files = Exit.isSuccess(exit) ? exit.value : yield* fallback

          if (files.length > limit) {
            truncated = true
            files.length = limit
          }
          files.sort((a, b) => b.mtime - a.mtime)

          const output: string[] = []
          if (files.length === 0) output.push("No files found")
          if (files.length > 0) {
            output.push(...files.map((file) => file.path))
            if (truncated) {
              output.push("")
              output.push(
                `(Results are truncated: showing first ${limit} results. Consider using a more specific path or pattern.)`,
              )
            }
          }

          return {
            title: path.relative(ins.worktree, search),
            metadata: {
              count: files.length,
              truncated,
            },
            output: output.join("\n"),
          }
        }).pipe(Effect.orDie),
    }
  }),
)
