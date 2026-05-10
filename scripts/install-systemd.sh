#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="/etc/zingpop/zingpop.env"

if [[ "$(id -u)" != "0" ]]; then
  echo "Run as root on the production server." >&2
  exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "bun is required before installing services." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required before installing zingpop-console.service." >&2
  echo "Install Node.js 22+ on the server, then rerun this script." >&2
  exit 1
fi

if [[ "$(node -p 'Number(process.versions.node.split(".")[0])')" -lt 22 ]]; then
  echo "Node.js 22+ is required before installing zingpop-console.service." >&2
  echo "Current version: $(node -v)" >&2
  exit 1
fi

if [[ ! -x /usr/local/bin/bun ]]; then
  install -Dm755 "$(command -v bun)" /usr/local/bin/bun
fi

id zingpop >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/zingpop --shell /usr/sbin/nologin zingpop

install -d -o zingpop -g zingpop /srv/zingpop/workspaces
install -d -o zingpop -g zingpop /srv/zingpop/workspaces/default
install -d -o zingpop -g zingpop /srv/zingpop/data
install -d -o zingpop -g zingpop /srv/zingpop/config
install -d -o zingpop -g zingpop /srv/zingpop/cache
install -d -o zingpop -g zingpop /srv/zingpop/state
install -d -o zingpop -g zingpop /var/log/zingpop
install -d /etc/zingpop
install -d /opt/zingpop
install -d /opt/zingpop/bin
install -d -o zingpop -g zingpop /opt/zingpop/console

if [[ -x "$ROOT_DIR/packages/opencode/dist/opencode-linux-x64/bin/opencode" ]]; then
  install -m 755 "$ROOT_DIR/packages/opencode/dist/opencode-linux-x64/bin/opencode" /opt/zingpop/bin/opencode
else
  echo "Missing Linux opencode binary. Run ./scripts/production-build.sh on the server before starting the service." >&2
fi

if [[ -f "$ROOT_DIR/packages/console/app/.output/server/index.mjs" ]]; then
  if grep -R "@manifest" -n "$ROOT_DIR/packages/console/app/.output/server" >/dev/null 2>&1; then
    echo "Console output contains development manifest imports. Run ./scripts/production-build.sh again with the latest deploy scripts." >&2
    exit 1
  fi

  rm -rf /opt/zingpop/console/.output
  cp -a "$ROOT_DIR/packages/console/app/.output" /opt/zingpop/console/.output
  chown -R zingpop:zingpop /opt/zingpop/console
else
  echo "Missing console output. Run ./scripts/production-build.sh on the server before starting the console service." >&2
fi

if [[ ! -f "$ENV_FILE" ]]; then
  install -m 600 "$ROOT_DIR/deploy/env/zingpop.env.example" "$ENV_FILE"
  echo "Created $ENV_FILE. Edit it before starting services."
fi

install -m 644 "$ROOT_DIR/deploy/systemd/zingpop-opencode.service" /etc/systemd/system/zingpop-opencode.service
install -m 644 "$ROOT_DIR/deploy/systemd/zingpop-console.service" /etc/systemd/system/zingpop-console.service
systemctl daemon-reload

echo "Installed zingpop-opencode.service and zingpop-console.service."
echo "Next:"
echo "  1. Edit $ENV_FILE"
echo "  2. Confirm /opt/zingpop/bin/opencode and /opt/zingpop/console/.output exist"
echo "  3. Run: systemctl enable --now zingpop-opencode zingpop-console"
