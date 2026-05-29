#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="/etc/zingpop/zingpop.env"

env_value() {
  local name="$1"
  (
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    printf "%s" "${!name:-}"
  )
}

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

if id zingpop >/dev/null 2>&1; then
  usermod --home /srv/zingpop zingpop >/dev/null 2>&1 || true
else
  useradd --system --home-dir /srv/zingpop --shell /usr/sbin/nologin zingpop
fi

install -d -o zingpop -g zingpop /srv/zingpop
install -d -o zingpop -g zingpop /srv/zingpop/workspaces
install -d -o zingpop -g zingpop /srv/zingpop/workspaces/default
install -d -o zingpop -g zingpop /srv/zingpop/data
install -d -o zingpop -g zingpop /srv/zingpop/config
install -d -o zingpop -g zingpop /srv/zingpop/cache
install -d -o zingpop -g zingpop /srv/zingpop/state
install -d -o zingpop -g zingpop /srv/zingpop/data/opencode
install -d -o zingpop -g zingpop /srv/zingpop/config/opencode
install -d -o zingpop -g zingpop /srv/zingpop/cache/opencode
install -d -o zingpop -g zingpop /srv/zingpop/cache/opencode/bin
install -d -o zingpop -g zingpop /srv/zingpop/state/opencode
install -d -o zingpop -g zingpop /srv/zingpop/data/opencode/log
install -d -o zingpop -g zingpop /var/log/zingpop
install -d /etc/zingpop
install -d /opt/zingpop
install -d /opt/zingpop/bin
install -d -o zingpop -g zingpop /opt/zingpop/app
install -d -o zingpop -g zingpop /opt/zingpop/console
install -d -m 700 -o root -g root /srv/zingpop/backups

if [[ -x "$ROOT_DIR/packages/opencode/dist/opencode-linux-x64/bin/opencode" ]]; then
  install -m 755 "$ROOT_DIR/packages/opencode/dist/opencode-linux-x64/bin/opencode" /opt/zingpop/bin/opencode
else
  echo "Missing Linux opencode binary. Run ./scripts/production-build.sh on the server before starting the service." >&2
fi

if [[ -d "$ROOT_DIR/packages/app/dist" ]]; then
  rm -rf /opt/zingpop/app/dist
  cp -a "$ROOT_DIR/packages/app/dist" /opt/zingpop/app/dist
  chown -R zingpop:zingpop /opt/zingpop/app
else
  echo "Missing opencode web UI assets. Run ./scripts/production-build.sh on the server before updating Nginx." >&2
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

if [[ -f "$ROOT_DIR/deploy/opencode/opencode.json" ]]; then
  if [[ -f /srv/zingpop/config/opencode/opencode.json ]] && ! cmp -s "$ROOT_DIR/deploy/opencode/opencode.json" /srv/zingpop/config/opencode/opencode.json; then
    cp -a /srv/zingpop/config/opencode/opencode.json "/srv/zingpop/config/opencode/opencode.json.bak.$(date +%Y%m%d%H%M%S)"
  fi
  install -m 640 -o zingpop -g zingpop "$ROOT_DIR/deploy/opencode/opencode.json" /srv/zingpop/config/opencode/opencode.json
else
  echo "Missing deploy/opencode/opencode.json. MyTokenLand provider config was not installed." >&2
fi

install -d /etc/nginx/snippets

OPENCODE_BASIC_USERNAME="$(env_value OPENCODE_SERVER_USERNAME)"
OPENCODE_BASIC_PASSWORD="$(env_value OPENCODE_SERVER_PASSWORD)"

if [[ -n "$OPENCODE_BASIC_USERNAME" && -n "$OPENCODE_BASIC_PASSWORD" ]]; then
  printf 'proxy_set_header Authorization "Basic %s";\n' "$(printf "%s:%s" "$OPENCODE_BASIC_USERNAME" "$OPENCODE_BASIC_PASSWORD" | base64 -w 0)" > /etc/nginx/snippets/zingpop-opencode-basic-auth.conf
  chmod 600 /etc/nginx/snippets/zingpop-opencode-basic-auth.conf
else
  echo "Missing OPENCODE_SERVER_USERNAME or OPENCODE_SERVER_PASSWORD in $ENV_FILE. Nginx app proxy Basic Auth snippet was not updated." >&2
fi

install -m 644 "$ROOT_DIR/deploy/systemd/zingpop-opencode.service" /etc/systemd/system/zingpop-opencode.service
install -m 644 "$ROOT_DIR/deploy/systemd/zingpop-console.service" /etc/systemd/system/zingpop-console.service
install -m 644 "$ROOT_DIR/deploy/systemd/zingpop-backup.service" /etc/systemd/system/zingpop-backup.service
install -m 644 "$ROOT_DIR/deploy/systemd/zingpop-backup.timer" /etc/systemd/system/zingpop-backup.timer
install -m 644 "$ROOT_DIR/deploy/systemd/zingpop-health-check.service" /etc/systemd/system/zingpop-health-check.service
install -m 644 "$ROOT_DIR/deploy/systemd/zingpop-health-check.timer" /etc/systemd/system/zingpop-health-check.timer
install -m 755 "$ROOT_DIR/scripts/production-backup.sh" /opt/zingpop/bin/production-backup.sh
install -m 755 "$ROOT_DIR/scripts/production-restore-drill.sh" /opt/zingpop/bin/production-restore-drill.sh
install -m 755 "$ROOT_DIR/scripts/production-health-check.mjs" /opt/zingpop/bin/production-health-check.mjs
install -m 755 "$ROOT_DIR/scripts/production-rotate-local-secrets.sh" /opt/zingpop/bin/production-rotate-local-secrets.sh
install -m 644 "$ROOT_DIR/deploy/logrotate/zingpop" /etc/logrotate.d/zingpop
systemctl daemon-reload

echo "Installed zingpop-opencode.service and zingpop-console.service."
echo "Next:"
echo "  1. Edit $ENV_FILE"
echo "  2. Confirm /opt/zingpop/bin/opencode and /opt/zingpop/console/.output exist"
echo "  3. Run: systemctl enable --now zingpop-opencode zingpop-console zingpop-backup.timer zingpop-health-check.timer"
