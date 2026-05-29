#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ZINGPOP_ENV_FILE:-/etc/zingpop/zingpop.env}"

if [[ "$(id -u)" != "0" ]]; then
  echo "Run as root on the production server." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to generate secrets." >&2
  exit 1
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup="$ENV_FILE.rotate-$timestamp"
cp "$ENV_FILE" "$backup"
chmod 600 "$backup"

generate_secret() {
  node -e 'console.log(require("node:crypto").randomBytes(48).toString("base64url"))'
}

set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    return
  fi
  printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
}

set_env "ZEN_SESSION_SECRET" "$(generate_secret)"
set_env "OPENCODE_SERVER_PASSWORD" "$(generate_secret)"

chown root:root "$ENV_FILE"
chmod 600 "$ENV_FILE"

echo "Rotated ZEN_SESSION_SECRET and OPENCODE_SERVER_PASSWORD."
echo "Backup written to $backup"
echo "Next: run ./scripts/install-systemd.sh or reinstall the Nginx Basic Auth snippet, then restart zingpop-console zingpop-opencode nginx."
