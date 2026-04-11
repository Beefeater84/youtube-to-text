#!/usr/bin/env bash
set -euo pipefail

# Load environment variables if .env exists
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

BASE_URL="${SMOKE_BASE_URL:-http://localhost}"
TARGETS="${SMOKE_TARGETS:-/}"
TIMEOUT_SECONDS="${SMOKE_TIMEOUT_SECONDS:-10}"
MAX_RETRIES=12
RETRY_INTERVAL=5

echo "Starting smoke checks against ${BASE_URL}"

for target in ${TARGETS}; do
  url="${BASE_URL}${target}"
  success=false
  
  for ((i=1; i<=MAX_RETRIES; i++)); do
    echo "Attempt $i/$MAX_RETRIES: Checking ${url}"
    
    # Use -L to follow redirects (Caddy might redirect http -> https if domain is used)
    # Use -k if we want to ignore self-signed certs during smoke check
    status_code="$(curl -sS -o /dev/null -w "%{http_code}" -L -k --max-time "${TIMEOUT_SECONDS}" "${url}")" || status_code="000"

    if [[ "${status_code}" -ge 200 && "${status_code}" -lt 400 ]]; then
      echo "Success: HTTP ${status_code}"
      success=true
      break
    fi

    echo "Status: HTTP ${status_code}. Retrying in ${RETRY_INTERVAL}s..."
    sleep "${RETRY_INTERVAL}"
  done

  if [[ "${success}" == "false" ]]; then
    echo "Error: Smoke check failed for ${url} after ${MAX_RETRIES} attempts."
    echo "--- Caddy Logs ---"
    docker compose -f deploy/docker-compose.prod.yml logs reverse-proxy --tail 50
    echo "--- Web Logs ---"
    docker compose -f deploy/docker-compose.prod.yml logs web --tail 50
    exit 1
  fi
done

echo "All smoke checks passed successfully!"

