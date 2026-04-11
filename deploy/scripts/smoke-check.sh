#!/usr/bin/env bash
set -euo pipefail

# Load environment variables if .env exists
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

BASE_URL="${SMOKE_BASE_URL:-http://127.0.0.1}"
TARGETS="${SMOKE_TARGETS:-/ /health}"
TIMEOUT_SECONDS="${SMOKE_TIMEOUT_SECONDS:-10}"

echo "Running smoke checks against ${BASE_URL}"

for target in ${TARGETS}; do
  url="${BASE_URL}${target}"
  echo "Checking ${url}"
  status_code="$(curl -sS -o /dev/null -w "%{http_code}" --max-time "${TIMEOUT_SECONDS}" "${url}")"

  if [[ "${status_code}" -lt 200 || "${status_code}" -ge 400 ]]; then
    echo "Smoke check failed for ${url}: HTTP ${status_code}"
    exit 1
  fi
done

echo "Smoke checks passed."
