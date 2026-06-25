#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ziwei}"
BRANCH="${BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-ziwei-backend}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:4000/health}"

cd "$APP_DIR"

git fetch origin "$BRANCH"
if [ "${FORCE_RESET:-0}" = "1" ]; then
  git reset --hard "origin/$BRANCH"
else
  git merge --ff-only "origin/$BRANCH"
fi

cd "$APP_DIR/backend"
npm ci --omit=dev

install -D -m 0644 "$APP_DIR/deploy/$SERVICE_NAME.service" "/etc/systemd/system/$SERVICE_NAME.service"

systemctl daemon-reload
systemctl enable "$SERVICE_NAME" >/dev/null
systemctl restart "$SERVICE_NAME"

for attempt in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    echo "Backend is healthy: $HEALTH_URL"
    exit 0
  fi
  sleep 1
done

echo "Backend did not become healthy. Recent logs:" >&2
journalctl -u "$SERVICE_NAME" -n 80 --no-pager >&2 || true
exit 1
