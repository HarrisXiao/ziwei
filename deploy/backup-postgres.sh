#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-/etc/ziwei/backend.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/ziwei}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is missing from $ENV_FILE" >&2
  exit 1
fi

install -d -m 0750 "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/ziwei-$(date +%Y%m%d-%H%M%S).dump"

pg_dump "$DATABASE_URL" --format=custom --file="$BACKUP_FILE"
chmod 0640 "$BACKUP_FILE"

echo "PostgreSQL backup created: $BACKUP_FILE"
