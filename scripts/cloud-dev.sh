#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${PUBLIC_HOST:-}"
PASSWORD="${OPENCODE_SERVER_PASSWORD:-}"

if [ -z "$HOST" ]; then
  HOST="$(curl -fsS --max-time 3 https://api.ipify.org 2>/dev/null || true)"
fi

if [ -z "$HOST" ]; then
  HOST="$(hostname -I | awk '{print $1}')"
fi

if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
  export PATH="$BUN_INSTALL/bin:$PATH"
fi

cd "$ROOT"
bun scripts/verify-zingpop-opencode-config.mjs
ENV_FILE="${ZINGPOP_ENV_FILE:-$ROOT/deploy/env/zingpop.env.local}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi
if [ -z "${ZAI_API_KEY:-}" ] || [ "${ZAI_API_KEY:-}" = "replace-with-official-glm-key" ]; then
  echo "ZAI_API_KEY is required for GLM requests. Export it or set ZINGPOP_ENV_FILE to an env file before starting cloud dev." >&2
  exit 1
fi
bun install

mkdir -p "$ROOT/.cloud-logs"
pkill -f "src/index.ts serve --hostname 0.0.0.0 --port 4096" 2>/dev/null || true
pkill -f "vite.*--port 3001" 2>/dev/null || true
pkill -f "vite.*--port 3000" 2>/dev/null || true

BACKEND_ENV=()
if [ -n "$PASSWORD" ]; then
  BACKEND_ENV=(OPENCODE_SERVER_PASSWORD="$PASSWORD")
fi
BACKEND_ENV+=(
  OPENCODE_CONFIG_DIR="$ROOT/deploy/opencode"
  OPENCODE_DISABLE_PROJECT_CONFIG=1
)

env "${BACKEND_ENV[@]}" nohup bun run --cwd packages/opencode --conditions=browser src/index.ts serve \
  --hostname 0.0.0.0 \
  --port 4096 \
  --cors "http://$HOST:3001" \
  --cors "http://localhost:3001" \
  > "$ROOT/.cloud-logs/opencode-server.log" 2>&1 &

nohup env VITE_OPENCODE_SERVER_HOST="$HOST" VITE_OPENCODE_SERVER_PORT=4096 \
  bun run --cwd packages/app dev -- --host 0.0.0.0 --port 3001 \
  > "$ROOT/.cloud-logs/workbench.log" 2>&1 &

nohup bun run --cwd packages/console/app dev -- --host 0.0.0.0 --port 3000 \
  > "$ROOT/.cloud-logs/home.log" 2>&1 &

sleep 3

echo
echo "Zingpop cloud dev is running:"
echo "  product home: http://$HOST:3000/"
echo "  workbench:    http://$HOST:3001/"
echo "  backend:      http://$HOST:4096/"
echo
echo "Logs:"
echo "  tail -f $ROOT/.cloud-logs/home.log"
echo "  tail -f $ROOT/.cloud-logs/workbench.log"
echo "  tail -f $ROOT/.cloud-logs/opencode-server.log"
echo
echo "Make sure Huawei Cloud security group allows TCP ports 3000, 3001, and 4096."
if [ -n "$PASSWORD" ]; then
  echo "Backend auth username: opencode"
  echo "Backend auth password: $PASSWORD"
fi
