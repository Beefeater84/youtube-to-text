# VPS Deployment Guide

## Services

- `reverse-proxy`: Caddy entrypoint with TLS and reverse proxy.
- `web`: Next.js production app.
- `worker`: BullMQ worker process.
- `redis`: Queue backend.

Application source and npm project are located in `src/`.

## One-time server setup

1. Install Docker Engine and Docker Compose plugin.
2. Clone the repository on VPS.
3. Copy env template:
   - `cp deploy/.env.example deploy/.env`
4. Fill secrets in `deploy/.env`.

## Required GitHub repository secrets

- `VPS_HOST`
- `VPS_PORT` (optional, defaults to `22`)
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_DEPLOY_PATH` (absolute path to repository on VPS)
- `DEPLOY_ENV_FILE` (optional multiline content for `deploy/.env`)

## Manual deployment

```bash
docker compose -f deploy/docker-compose.prod.yml pull
docker compose -f deploy/docker-compose.prod.yml up -d --remove-orphans
bash deploy/scripts/smoke-check.sh
```

## Rollback

1. Pick previous image tags from GHCR history (web and worker).
2. Run:

```bash
bash deploy/scripts/rollback.sh <web_tag> <worker_tag>
```

This updates `deploy/.env`, recreates containers, and runs smoke checks.

## Failed jobs alert

Run periodically (for example, every 5 minutes via cron):

```bash
bash deploy/scripts/failed-jobs-alert.sh
```

Script behavior:

- Reads BullMQ failed set (`bull:<QUEUE_NAME>:failed`) from Redis.
- Exits with code `2` when threshold is exceeded.
- Sends Slack message when `SLACK_WEBHOOK_URL` is set.

## Sentry

- Use `SENTRY_DSN_WEB` and `SENTRY_DSN_WORKER` in `deploy/.env`.
- App code should initialize Sentry separately in web and worker runtimes.
