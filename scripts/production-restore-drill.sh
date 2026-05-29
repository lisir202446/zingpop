#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ZINGPOP_ENV_FILE:-/etc/zingpop/zingpop.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

BACKUP_ROOT="${ZINGPOP_BACKUP_ROOT:-/srv/zingpop/backups}"
BACKUP_DIR="${1:-}"

if [[ -z "$BACKUP_DIR" ]]; then
  BACKUP_DIR="$(find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -name "zingpop-*" | sort | tail -n 1)"
fi

if [[ -z "$BACKUP_DIR" || ! -d "$BACKUP_DIR" ]]; then
  echo "No backup directory found under $BACKUP_ROOT" >&2
  exit 1
fi

for file in mysql.sql.gz files.tgz SHA256SUMS; do
  if [[ ! -s "$BACKUP_DIR/$file" ]]; then
    echo "Backup is missing $file: $BACKUP_DIR" >&2
    exit 1
  fi
done

(
  cd "$BACKUP_DIR"
  sha256sum -c SHA256SUMS
)

gzip -t "$BACKUP_DIR/mysql.sql.gz"
tar -tzf "$BACKUP_DIR/files.tgz" >/dev/null

if [[ -n "${ZINGPOP_RESTORE_DRILL_DATABASE:-}" ]]; then
  if [[ ! "$ZINGPOP_RESTORE_DRILL_DATABASE" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "ZINGPOP_RESTORE_DRILL_DATABASE may only contain letters, numbers, and underscores." >&2
    exit 1
  fi

  for name in MYSQL_HOST MYSQL_USER MYSQL_PASSWORD; do
    if [[ -z "${!name:-}" ]]; then
      echo "Missing required environment variable for database drill: $name" >&2
      exit 1
    fi
  done

  if ! command -v mysql >/dev/null 2>&1; then
    echo "mysql client is required for database restore drills." >&2
    exit 1
  fi

  exists="$(MYSQL_PWD="$MYSQL_PASSWORD" mysql -h "$MYSQL_HOST" -P "${MYSQL_PORT:-3306}" -u "$MYSQL_USER" -Nse "SHOW DATABASES LIKE '${ZINGPOP_RESTORE_DRILL_DATABASE}'" || true)"
  if [[ -n "$exists" && "${ZINGPOP_RESTORE_DRILL_OVERWRITE:-0}" != "1" ]]; then
    echo "Drill database already exists: $ZINGPOP_RESTORE_DRILL_DATABASE" >&2
    echo "Set ZINGPOP_RESTORE_DRILL_OVERWRITE=1 to replace it." >&2
    exit 1
  fi

  if [[ -n "$exists" ]]; then
    MYSQL_PWD="$MYSQL_PASSWORD" mysql -h "$MYSQL_HOST" -P "${MYSQL_PORT:-3306}" -u "$MYSQL_USER" -e "DROP DATABASE \`$ZINGPOP_RESTORE_DRILL_DATABASE\`"
  fi

  MYSQL_PWD="$MYSQL_PASSWORD" mysql -h "$MYSQL_HOST" -P "${MYSQL_PORT:-3306}" -u "$MYSQL_USER" -e "CREATE DATABASE \`$ZINGPOP_RESTORE_DRILL_DATABASE\`"
  gunzip -c "$BACKUP_DIR/mysql.sql.gz" | MYSQL_PWD="$MYSQL_PASSWORD" mysql -h "$MYSQL_HOST" -P "${MYSQL_PORT:-3306}" -u "$MYSQL_USER" "$ZINGPOP_RESTORE_DRILL_DATABASE"
  MYSQL_PWD="$MYSQL_PASSWORD" mysql -h "$MYSQL_HOST" -P "${MYSQL_PORT:-3306}" -u "$MYSQL_USER" -Nse "SHOW TABLES" "$ZINGPOP_RESTORE_DRILL_DATABASE" >/dev/null
fi

echo "Restore drill passed for $BACKUP_DIR"
