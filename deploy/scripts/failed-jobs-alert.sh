#!/usr/bin/env bash
set -euo pipefail

: "${REDIS_URL:?REDIS_URL is required}"

QUEUE_NAME="${QUEUE_NAME:-transcript-jobs}"
FAILED_JOBS_ALERT_THRESHOLD="${FAILED_JOBS_ALERT_THRESHOLD:-20}"
FAILED_KEY="bull:${QUEUE_NAME}:failed"

if ! command -v redis-cli >/dev/null 2>&1; then
  echo "redis-cli is required for failed jobs alert checks."
  exit 1
fi

failed_count="$(redis-cli -u "${REDIS_URL}" ZCARD "${FAILED_KEY}" | tr -d '\r')"

if ! [[ "${failed_count}" =~ ^[0-9]+$ ]]; then
  echo "Cannot parse failed jobs count for key ${FAILED_KEY}: ${failed_count}"
  exit 1
fi

echo "Queue=${QUEUE_NAME} failed_jobs=${failed_count} threshold=${FAILED_JOBS_ALERT_THRESHOLD}"

if [[ "${failed_count}" -gt "${FAILED_JOBS_ALERT_THRESHOLD}" ]]; then
  message="Alert: failed jobs count is ${failed_count} (threshold ${FAILED_JOBS_ALERT_THRESHOLD}) for queue ${QUEUE_NAME}."
  echo "${message}"

  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    payload="$(printf '{"text":"%s"}' "${message}")"
    curl -sS -X POST -H 'Content-Type: application/json' --data "${payload}" "${SLACK_WEBHOOK_URL}" >/dev/null
    echo "Slack alert sent."
  fi
  exit 2
fi

echo "Failed jobs count is within threshold."
