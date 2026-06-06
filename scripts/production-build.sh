#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

bun scripts/verify-zingpop-opencode-config.mjs

export NODE_ENV=production
export VITE_ZINGPOP_HOSTED_WORKBENCH=1
OPENCODE_BUILD_ARGS=(--single)

if [[ "${ZINGPOP_SKIP_BUN_INSTALL:-0}" == "1" ]]; then
  echo "Using existing node_modules; ZINGPOP_SKIP_BUN_INSTALL=1."
  scripts/production-bun-install.sh --verify-only
  OPENCODE_BUILD_ARGS+=(--skip-install)
else
  scripts/production-bun-install.sh
fi

# Existing opencode build embeds packages/app into the server binary. This keeps
# the workbench and backend on one origin in production.
bun run --cwd packages/opencode build "${OPENCODE_BUILD_ARGS[@]}"

# Product home build is separate from the opencode workbench.
rm -rf \
  packages/console/app/.output \
  packages/console/app/.wrangler \
  packages/console/app/node_modules/.nitro

NITRO_PRESET="${ZINGPOP_CONSOLE_NITRO_PRESET:-node_server}" bun run --cwd packages/console/app build

if grep -R "@manifest" -n packages/console/app/.output/server >/dev/null 2>&1; then
  echo "Console build contains development manifest imports. Refusing to install a broken production build." >&2
  exit 1
fi

echo "Production build complete."
echo "Workbench binary: packages/opencode/dist/"
echo "Product home output: packages/console/app/.output/"
