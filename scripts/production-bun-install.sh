#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

REGISTRY="${ZINGPOP_BUN_REGISTRY:-${npm_config_registry:-https://registry.npmjs.org/}}"
ATTEMPTS="${ZINGPOP_BUN_INSTALL_ATTEMPTS:-4}"
NETWORK_CONCURRENCY="${ZINGPOP_BUN_NETWORK_CONCURRENCY:-8}"
CACHE_PARENT="${ZINGPOP_BUN_CACHE_PARENT:-${TMPDIR:-/tmp}/zingpop-bun-install-cache}"

verify_install() {
  if [[ ! -d node_modules ]]; then
    echo "Missing root node_modules after bun install." >&2
    return 1
  fi

  (
    cd packages/opencode
    bun -e 'import "@opentui/solid/preload"; console.log("verified @opentui/solid/preload")'
  )

  (
    cd packages/app
    bun -e 'console.log(await import.meta.resolve("tailwindcss/theme.css"))'
  )

  (
    cd packages/ui
    bun -e 'console.log(await import.meta.resolve("@tsconfig/node22/tsconfig.json"))'
    bun -e 'console.log(await import.meta.resolve("katex/dist/katex.min.css"))'
  )
}

if [[ "${1:-}" == "--verify-only" ]]; then
  verify_install
  exit 0
fi

mkdir -p "$CACHE_PARENT"

for attempt in $(seq 1 "$ATTEMPTS"); do
  CACHE_DIR="$CACHE_PARENT/attempt-$attempt-$$"
  rm -rf "$CACHE_DIR"
  mkdir -p "$CACHE_DIR"

  echo "Running bun install attempt $attempt/$ATTEMPTS using registry $REGISTRY"

  rm -rf \
    node_modules \
    packages/opencode/node_modules \
    packages/app/node_modules \
    packages/console/app/node_modules

  if bun install \
    --frozen-lockfile \
    --force \
    --registry "$REGISTRY" \
    --cache-dir "$CACHE_DIR" \
    --network-concurrency "$NETWORK_CONCURRENCY" \
    --backend=copyfile; then
    if verify_install; then
      rm -rf "$CACHE_DIR"
      echo "Bun install verified."
      exit 0
    fi
  fi

  echo "Bun install attempt $attempt failed; clearing caches before retry." >&2
  bun pm cache rm || true
  rm -rf "$CACHE_DIR"
  sleep "$attempt"
done

echo "Bun install failed after $ATTEMPTS attempts." >&2
exit 1
