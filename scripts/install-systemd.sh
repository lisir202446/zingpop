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

if [[ ! -x /usr/local/bin/bun ]]; then
  install -Dm755 "$(command -v bun)" /usr/local/bin/bun
fi

id zingpop >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/zingpop --shell /usr/sbin/nologin zingpop

install -d -o zingpop -g zingpop /srv/zingpop/workspaces
install -d -o zingpop -g zingpop /srv/zingpop/workspaces/default
install -d -o zingpop -g zingpop /srv/zingpop/data
install -d -o zingpop -g zingpop /srv/zingpop/config
install -d -o zingpop -g zingpop /var/log/zingpop
install -d /etc/zingpop
install -d /opt/zingpop
install -d /opt/zingpop/bin

if [[ -x "$ROOT_DIR/packages/opencode/dist/opencode-linux-x64/bin/opencode" ]]; then
  install -m 755 "$ROOT_DIR/packages/opencode/dist/opencode-linux-x64/bin/opencode" /opt/zingpop/bin/opencode
else
  echo "Missing Linux opencode binary. Run ./scripts/production-build.sh on the server before starting the service." >&2
fi

if [[ ! -f "$ENV_FILE" ]]; then
  install -m 600 "$ROOT_DIR/deploy/env/zingpop.env.example" "$ENV_FILE"
  echo "Created $ENV_FILE. Edit it before starting services."
fi

install -m 644 "$ROOT_DIR/deploy/systemd/zingpop-opencode.service" /etc/systemd/system/zingpop-opencode.service
systemctl daemon-reload

echo "Installed zingpop-opencode.service."
echo "Next:"
echo "  1. Edit $ENV_FILE"
echo "  2. Confirm /opt/zingpop/bin/opencode exists"
echo "  3. Run: systemctl enable --now zingpop-opencode"
