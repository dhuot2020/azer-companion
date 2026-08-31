#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/azer-companion}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-azer-companion}"
ENV_FILE="${ENV_FILE:-/etc/azer-companion/azer-companion.env}"

if [[ ! -r "$ENV_FILE" ]]; then
  echo "Fichier d'environnement introuvable ou illisible: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

cd "$APP_DIR"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Deploiement refuse: le depot du VPS contient des modifications locales." >&2
  exit 1
fi

git fetch --prune origin
git checkout "$DEPLOY_BRANCH"
git pull --ff-only origin "$DEPLOY_BRANCH"

npm ci --omit=dev
npm run db:migrate
npm test

sudo systemctl restart "$SERVICE_NAME"
sudo systemctl --no-pager --full status "$SERVICE_NAME"

curl --fail --silent --show-error http://127.0.0.1:3030/api/db/health
echo
