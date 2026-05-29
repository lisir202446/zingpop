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

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

for name in MYSQL_HOST MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE; do
  require_var "$name"
done

if ! command -v mysqldump >/dev/null 2>&1; then
  echo "mysqldump is required for production backups." >&2
  exit 1
fi

umask 077

BACKUP_ROOT="${ZINGPOP_BACKUP_ROOT:-/srv/zingpop/backups}"
RETENTION_DAYS="${ZINGPOP_BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="$BACKUP_ROOT/zingpop-$STAMP"

install -d -m 700 "$BACKUP_ROOT"
install -d -m 700 "$DEST"

MYSQL_PWD="$MYSQL_PASSWORD" mysqldump \
  --single-transaction \
  --quick \
  --no-tablespaces \
  --routines \
  --triggers \
  -h "$MYSQL_HOST" \
  -P "${MYSQL_PORT:-3306}" \
  -u "$MYSQL_USER" \
  "$MYSQL_DATABASE" | gzip -9 > "$DEST/mysql.sql.gz"

tar_paths=()
for path in \
  srv/zingpop \
  etc/zingpop \
  etc/nginx/sites-available/zingpop-app.conf \
  etc/nginx/sites-available/zingpop-www.conf \
  etc/nginx/snippets/zingpop-opencode-basic-auth.conf \
  etc/systemd/system/zingpop-console.service \
  etc/systemd/system/zingpop-opencode.service \
  etc/systemd/system/zingpop-backup.service \
  etc/systemd/system/zingpop-backup.timer \
  etc/systemd/system/zingpop-health-check.service \
  etc/systemd/system/zingpop-health-check.timer \
  etc/logrotate.d/zingpop; do
  if [[ -e "/$path" ]]; then
    tar_paths+=("$path")
  fi
done

if [[ "${#tar_paths[@]}" -gt 0 ]]; then
  tar -C / --exclude=srv/zingpop/backups -czf "$DEST/files.tgz" "${tar_paths[@]}"
else
  echo "No filesystem paths found for backup." >&2
  exit 1
fi

(
  cd "$DEST"
  sha256sum mysql.sql.gz files.tgz > SHA256SUMS
)

find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -name "zingpop-*" -mtime +"$RETENTION_DAYS" -exec rm -rf {} +

echo "Backup written to $DEST"
