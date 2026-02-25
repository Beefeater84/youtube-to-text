#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "" || "${2:-}" == "" ]]; then
  echo "Usage: bash deploy/scripts/rollback.sh <web_tag> <worker_tag>"
  exit 1
fi

WEB_TAG="$1"
WORKER_TAG="$2"
ENV_FILE="${ENV_FILE_PATH:-deploy/.env}"
COMPOSE_FILE="${COMPOSE_FILE_PATH:-deploy/docker-compose.prod.yml}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Env file not found: ${ENV_FILE}"
  exit 1
fi

echo "Rolling back to WEB_IMAGE_TAG=${WEB_TAG}, WORKER_IMAGE_TAG=${WORKER_TAG}"

# Keep updates idempotent and explicit for reproducible rollbacks.
if grep -q '^WEB_IMAGE_TAG=' "${ENV_FILE}"; then
  sed -i "s/^WEB_IMAGE_TAG=.*/WEB_IMAGE_TAG=${WEB_TAG}/" "${ENV_FILE}"
else
  printf '\nWEB_IMAGE_TAG=%s\n' "${WEB_TAG}" >> "${ENV_FILE}"
fi

if grep -q '^WORKER_IMAGE_TAG=' "${ENV_FILE}"; then
  sed -i "s/^WORKER_IMAGE_TAG=.*/WORKER_IMAGE_TAG=${WORKER_TAG}/" "${ENV_FILE}"
else
  printf 'WORKER_IMAGE_TAG=%s\n' "${WORKER_TAG}" >> "${ENV_FILE}"
fi

docker compose -f "${COMPOSE_FILE}" pull
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans
bash deploy/scripts/smoke-check.sh

echo "Rollback completed."
