#!/usr/bin/env bash
set -euo pipefail

# Load environment variables if .env exists (relative to CWD which is expected to be VPS_DEPLOY_PATH)
if [ -f .env ]; then
  # Read .env file line by line, ignore comments and empty lines, and export
  while IFS= read -r line || [ -n "$line" ]; do
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue
    export "$line"
  done < .env
fi

: "${NEXT_PUBLIC_SUPABASE_URL:?NEXT_PUBLIC_SUPABASE_URL is required}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is required}"

FAILED_JOBS_ALERT_THRESHOLD="${FAILED_JOBS_ALERT_THRESHOLD:-20}"

# Use curl to get the count of failed transcripts from Supabase via PostgREST
# Prefer: count=exactly returns the total count in the Content-Range header
# We use -I to get headers only and extract the count from Content-Range: 0-0/COUNT
failed_count=$(curl -s -I \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Prefer: count=exactly" \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/transcripts?status=eq.failed&select=id" \
  | grep -i "content-range" | cut -d'/' -f2 | tr -d '\r' | xargs || echo "0")

if ! [[ "${failed_count}" =~ ^[0-9]+$ ]]; then
  echo "Error: Could not retrieve failed jobs count from Supabase. Result: ${failed_count}"
  exit 1
fi

echo "failed_jobs=${failed_count} threshold=${FAILED_JOBS_ALERT_THRESHOLD}"

if [[ "${failed_count}" -gt "${FAILED_JOBS_ALERT_THRESHOLD}" ]]; then
  message="Alert: failed jobs count is ${failed_count} (threshold ${FAILED_JOBS_ALERT_THRESHOLD}) in Supabase transcripts table."
  echo "${message}"

  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    payload=$(printf '{"text":"%s"}' "${message}")
    curl -sS -X POST -H 'Content-Type: application/json' --data "${payload}" "${SLACK_WEBHOOK_URL}" >/dev/null
    echo "Slack alert sent."
  fi
  exit 2
fi

echo "Failed jobs count is within threshold."
