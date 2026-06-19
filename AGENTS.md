- To regenerate the JavaScript SDK, run `./packages/sdk/js/script/build.ts`.
- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE.
- The default branch in this repo is `dev`.
- Local `main` ref may not exist; use `dev` or `origin/dev` for diffs.
- Prefer automation: execute requested actions without confirmation unless blocked by missing info or safety/irreversibility.

## Zingpop Integration Boundary

- Do not change opencode's reusable runtime/core behavior unless the user explicitly approves that specific low-level change.
- Productionization work must be additive around the existing opencode runtime: use configuration, deployment scripts, Nginx, systemd, environment variables, wrapper scripts, docs, or Zingpop-only layers first.
- Before changing files under `packages/opencode/src`, check whether opencode already provides the needed capability. If it does, reuse it instead of modifying it.
- Any change must preserve the existing opencode bottom-layer run path. Do not break `packages/opencode` CLI/server behavior, SDK generation, project/session/file routing, or desktop/web runtime assumptions.
- If a required feature cannot be implemented without changing opencode core behavior, stop and explain the tradeoff before editing.

## Zingpop Production Deploy Rules

- Keep deploy sequencing strict: local changes/checks -> GitHub transport -> server build/install/restart -> server-side verification.
- Do not make Huawei Cloud production deploys depend on `git fetch` from the server. The server's GitHub Git transport can be unstable; prefer GitHub codeload tarballs for exact commits when deploying or recovering.
- Tarball/codeload sources do not include `.git`. Production builds from tarballs must set `OPENCODE_CHANNEL` and `OPENCODE_VERSION` explicitly so opencode build scripts do not fall back to `git branch --show-current`.
- Do not ask the user to paste long heredoc deploy scripts into CloudShell. Use a short bootstrap command or split commands into small blocks; run long builds with `nohup` and a log file so CloudShell disconnects do not stop deployment.
- If `bun install` hangs on the server, do not keep retrying the same install path. First verify whether existing server `node_modules` satisfies `scripts/production-bun-install.sh --verify-only`; if it does, deploy with `ZINGPOP_SKIP_BUN_INSTALL=1`.
- Avoid copying Bun `node_modules` trees with `cp -a` as a rescue path because `.bun` link/cache directories can collide. Prefer using the existing repo checkout, a clean install, or symlinking existing `node_modules` only as a deliberate rescue step with verification before install/restart.
- Production deployment is not complete until server-side evidence confirms the exact commit: `production-ux-probe` passes, `/opt/zingpop/app/dist/zingpop-build.json` matches the expected commit, Nginx validates/reloads, services restart, and the public app returns the expected auth redirect or page.

## Style Guide

### General Principles

- Keep things in one function unless composable or reusable
- Avoid `try`/`catch` where possible
- Avoid using the `any` type
- Use Bun APIs when possible, like `Bun.file()`
- Rely on type inference when possible; avoid explicit type annotations or interfaces unless necessary for exports or clarity
- Prefer functional array methods (flatMap, filter, map) over for loops; use type guards on filter to maintain type inference downstream
- In `src/config`, follow the existing self-export pattern at the top of the file (for example `export * as ConfigAgent from "./agent"`) when adding a new config module.

Reduce total variable count by inlining when a value is only used once.

```ts
// Good
const journal = await Bun.file(path.join(dir, "journal.json")).json()

// Bad
const journalPath = path.join(dir, "journal.json")
const journal = await Bun.file(journalPath).json()
```

### Destructuring

Avoid unnecessary destructuring. Use dot notation to preserve context.

```ts
// Good
obj.a
obj.b

// Bad
const { a, b } = obj
```

### Variables

Prefer `const` over `let`. Use ternaries or early returns instead of reassignment.

```ts
// Good
const foo = condition ? 1 : 2

// Bad
let foo
if (condition) foo = 1
else foo = 2
```

### Control Flow

Avoid `else` statements. Prefer early returns.

```ts
// Good
function foo() {
  if (condition) return 1
  return 2
}

// Bad
function foo() {
  if (condition) return 1
  else return 2
}
```

### Schema Definitions (Drizzle)

Use snake_case for field names so column names don't need to be redefined as strings.

```ts
// Good
const table = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  created_at: integer().notNull(),
})

// Bad
const table = sqliteTable("session", {
  id: text("id").primaryKey(),
  projectID: text("project_id").notNull(),
  createdAt: integer("created_at").notNull(),
})
```

## Testing

- Avoid mocks as much as possible
- Test actual implementation, do not duplicate logic into tests
- Tests cannot run from repo root (guard: `do-not-run-tests-from-root`); run from package dirs like `packages/opencode`.

## Type Checking

- Always run `bun typecheck` from package directories (e.g., `packages/opencode`), never `tsc` directly.
