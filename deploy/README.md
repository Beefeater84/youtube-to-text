# VPS Deployment Guide

## Services

- `reverse-proxy`: Caddy entrypoint with TLS and reverse proxy.
- `web`: Next.js production app.
- `worker`: Python worker process (polls Postgres for jobs).

Application source is located in `web/` (Next.js) and `worker/` (Python).

## One-time server setup

1. Install Docker Engine and Docker Compose plugin.
2. Clone the repository on VPS.
3. Copy env template:
   - `cp deploy/.env.example .env`
4. Fill secrets in `.env`.

## Required GitHub repository secrets

- `VPS_HOST`
- `VPS_PORT` (optional, defaults to `22`)
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_DEPLOY_PATH` (absolute path to repository on VPS)
- `DEPLOY_ENV_FILE` (optional multiline content for `.env`)

## Manual deployment

```bash
docker compose --env-file ../.env -f deploy/docker-compose.prod.yml pull
docker compose --env-file ../.env -f deploy/docker-compose.prod.yml up -d --remove-orphans
bash deploy/scripts/smoke-check.sh
```

## Rollback

1. Pick previous image tags from GHCR history (web and worker).
2. Run:

```bash
bash deploy/scripts/rollback.sh <web_tag> <worker_tag>
```

This updates `.env`, recreates containers, and runs smoke checks.

## Failed jobs alert

Run periodically (for example, every 5 minutes via cron):

```bash
bash deploy/scripts/failed-jobs-alert.sh
```

Script behavior:

- Queries Supabase `transcripts` table for jobs with `status='failed'`.
- Exits with code `2` when threshold is exceeded.
- Sends Slack message when `SLACK_WEBHOOK_URL` is set.

## Sentry

- Use `SENTRY_DSN_WEB` and `SENTRY_DSN_WORKER` in `.env`.
- App code should initialize Sentry separately in web and worker runtimes.
