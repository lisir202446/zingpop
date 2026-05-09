#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

bun install --frozen-lockfile

# Existing opencode build embeds packages/app into the server binary. This keeps
# the workbench and backend on one origin in production.
bun run --cwd packages/opencode build --single

# Product home build is separate from the opencode workbench.
NITRO_PRESET="${ZINGPOP_CONSOLE_NITRO_PRESET:-node_server}" bun run --cwd packages/console/app build

echo "Production build complete."
echo "Workbench binary: packages/opencode/dist/"
echo "Product home output: packages/console/app/.output/"
