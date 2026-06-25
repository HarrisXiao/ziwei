#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ziwei}"
REPO_URL="${REPO_URL:-https://github.com/HarrisXiao/ziwei.git}"
BRANCH="${BRANCH:-main}"
API_DOMAIN="${API_DOMAIN:-}"
API_PORT="${API_PORT:-4000}"
DB_NAME="${DB_NAME:-ziwei}"
DB_USER="${DB_USER:-ziwei}"
DB_PASSWORD="${DB_PASSWORD:-}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root." >&2
  exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
  echo "Set DB_PASSWORD before running this script." >&2
  exit 1
fi

if ! [[ "$DB_NAME" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || ! [[ "$DB_USER" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "DB_NAME and DB_USER must be simple PostgreSQL identifiers." >&2
  exit 1
fi

DB_PASSWORD_SQL="${DB_PASSWORD//\'/\'\'}"

PKG_MANAGER="yum"
if command -v dnf >/dev/null 2>&1; then
  PKG_MANAGER="dnf"
fi

$PKG_MANAGER install -y git curl nginx postgresql-server postgresql-contrib

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -Eq '^v20\.'; then
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  $PKG_MANAGER install -y nodejs
fi

DB_PASSWORD_URL="$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$DB_PASSWORD")"

if [ ! -d /var/lib/pgsql/data/base ]; then
  postgresql-setup --initdb
fi

systemctl enable --now postgresql
systemctl enable --now nginx

runuser -u postgres -- psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || runuser -u postgres -- psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD_SQL}';"
runuser -u postgres -- psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || runuser -u postgres -- psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
runuser -u postgres -- psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" >/dev/null

if [ ! -e "$APP_DIR" ]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
elif [ ! -d "$APP_DIR/.git" ]; then
  echo "$APP_DIR exists but is not a git checkout. Move it away or set APP_DIR." >&2
  exit 1
else
  cd "$APP_DIR"
  git fetch origin "$BRANCH"
  git merge --ff-only "origin/$BRANCH"
fi

install -d -m 0750 /etc/ziwei
cat > /etc/ziwei/backend.env <<ENV
PORT=${API_PORT}
HOST=127.0.0.1
DATA_FILE=${APP_DIR}/backend/data/store.json
DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD_URL}@127.0.0.1:5432/${DB_NAME}
ENV
chmod 0640 /etc/ziwei/backend.env

cd "$APP_DIR/backend"
npm ci --omit=dev

install -D -m 0644 "$APP_DIR/deploy/ziwei-backend.service" /etc/systemd/system/ziwei-backend.service
systemctl daemon-reload
systemctl enable --now ziwei-backend

if [ -n "$API_DOMAIN" ]; then
  sed "s/api.example.com/${API_DOMAIN}/g; s/127.0.0.1:4000/127.0.0.1:${API_PORT}/g" \
    "$APP_DIR/deploy/nginx-ziwei-api.conf.template" \
    > /etc/nginx/conf.d/ziwei-api.conf
  nginx -t
  systemctl reload nginx
fi

curl -fsS "http://127.0.0.1:${API_PORT}/health"
echo
echo "Ziwei backend bootstrap complete."
