#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-/etc/ziwei/backend.env}"
BACKUP_FILE="${1:-}"
PG_RESTORE_BIN="${PG_RESTORE_BIN:-pg_restore}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 /path/to/ziwei-backup.dump" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Missing backup file: $BACKUP_FILE" >&2
  exit 1
fi

if ! command -v "$PG_RESTORE_BIN" >/dev/null 2>&1 && [ -x /usr/pgsql-14/bin/pg_restore ]; then
  PG_RESTORE_BIN=/usr/pgsql-14/bin/pg_restore
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is missing from $ENV_FILE" >&2
  exit 1
fi

"$PG_RESTORE_BIN" "$DATABASE_URL" --clean --if-exists --no-owner --no-privileges "$BACKUP_FILE"
echo "PostgreSQL backup restored from: $BACKUP_FILE"
