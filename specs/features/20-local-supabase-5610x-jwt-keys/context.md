# Context: #20 Локальный Supabase на портах 561xx со своими JWT-ключами

## Code map

- `supabase/config.toml` — `project_id = "youtube-to-text"`; ports 561xx (API 56121, DB 56122, shadow 56120, Studio 56123, Inbucket 56124, analytics 56127, pooler 56129, inspector 56183). `[auth]`: `site_url`, `jwt_expiry=3600`, commented `jwt_issuer`, `# signing_keys_path`; no `jwt_secret`/`anon_key`/`service_role_key`/`publishable_key`/`secret_key`. `[auth.external.google] client_id = "env(GOOGLE_CLIENT_ID)"` — the env pattern. `[storage]` has only a commented `[storage.buckets.images]` example. `[db.seed] enabled=true sql_paths=["./seed.sql"]`. realtime, analytics, edge_runtime, inbucket, pooler disabled. No bind-address option exists.
- `supabase/.gitignore` — `.branches`, `.temp`, `.env.keys`, `.env.local`, `.env.*.local`. `supabase/.env` is ignored by the ROOT `.gitignore` (`.env*`, `!.env.example`); `supabase/.env.example` is committable (checked with `git check-ignore`).
- `package.json` (root) — devDependencies only: `supabase ^2.87.2`, tailwind. No `scripts`. `node_modules/` absent in root.
- `supabase/migrations/` — 8 files, latest `20260313120000_waiting_dependency_status.sql`. None touches `storage.buckets`.
- `supabase/seed.sql` — one `do $$` block, 10 channels, tags, 6 transcripts, `on conflict do nothing`; no storage. Runs on first `start` and on `db reset`.
- `worker/src/db.py` — `ensure_storage_bucket() -> None` creates public `transcripts`, swallows "already exists". Keep unchanged.
- `worker/src/main.py` — `load_dotenv()` reads `worker/.env`; calls `ensure_storage_bucket()` at startup.
- `worker/src/config.py` — `_require_env(name)`; `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`.
- `web/libs/supabase/{client,server,admin,static}.ts`, `web/middleware.ts` — read `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Web uses the anon JWT, not publishable keys.
- `readme.md` lines ~26-36 — Local development: `npx supabase start`/`status`, copy keys into `web/.env.local` and `worker/.env`; line ~36 says keys are the well-known demo keys (rewrite).
- `docs/data-storage.md` lines ~66-72 — Bucket Setup says the worker creates the bucket; line ~87 Google creds in root `.env`.
- `specs/tech-stack.md` lines ~23-37 — Infrastructure, Environments, env var lists.

## Supabase CLI facts (2.111.0, seen in `/home/tony/home-agent/family-list/node_modules/@supabase/cli-linux-x64/bin/supabase`)

- Config keys with env overrides: `auth.jwt_secret` / `SUPABASE_AUTH_JWT_SECRET` (min 16 chars, default `super-secret-jwt-token-with-at-least-32-characters-long`); `auth.anon_key`, `auth.service_role_key` (derived from jwt_secret when unset); `auth.publishable_key` / `SUPABASE_AUTH_PUBLISHABLE_KEY` (default `a public `sb_publishable_…` demo value`); `auth.secret_key` / `SUPABASE_AUTH_SECRET_KEY` (default `a public `sb_secret_…` demo value`); `auth.signing_keys_path`.
- Env files read from `supabase/` then project root: `.env.<SUPABASE_ENV>.local`, `.env.local`, `.env.<SUPABASE_ENV>`, `.env` (SUPABASE_ENV defaults to `development`); earlier wins. The root `.env` holds Google creds locally.
- `supabase status -o env [--override-name api.url=NEXT_PUBLIC_SUPABASE_URL]`; `gen bearer-jwt --role ...`; `gen signing-key`.
- Buckets: a migration inserting into `storage.buckets`, or `[storage.buckets.<name>]` in config (seeded on start/db reset).
- Docker publishes ports on `0.0.0.0`. Tailscale runs inside WSL (`tailscale0`), so 0.0.0.0 ports are reachable from the user's tailnet, not from LAN/internet (WSL NAT).

## Patterns to follow

- Migration — like `supabase/migrations/20260313120000_waiting_dependency_status.sql`: `YYYYMMDDHHMMSS_snake_name.sql`, `-- vX: purpose` header, sections fenced with `----...`, uppercase SQL keywords, idempotent statements.
- `.env.example` — like `deploy/.env.example`: commented groups, empty values.
- Shell script — like `deploy/scripts/*.sh` (bash, `set -euo pipefail`).
- Docs — short paragraphs in the existing Local development section.

## Conventions

- Repo is public: no real keys, hostnames, Tailscale IPs or personal paths in commits. Non-obvious config gets a comment.
- Other Supabase stacks run on this machine and must keep running: only `npx supabase ...` from this repo; never `supabase stop --all`, `docker system prune`, `docker rm` of foreign containers, iptables, or `/etc/docker/daemon.json`.
- Migrations are created and applied only to the local temporary stack for verification; the agent never starts the final home stack with real keys.
- Root `.env` (Google creds) exists locally and is untracked; never read its values into output or commits.

## Gaps found during implementation
- Group 1 result: secret variable is `JWT_SECRET` (not `SUPABASE_AUTH_JWT_SECRET`): CLI 2.111.0 uses an unresolved `env(...)` literally; `env(JWT_SECRET)` is 15 chars < 16, so start fails without `supabase/.env`. Keep the name ≤ 10 chars. Script: `bash scripts/supabase-env.sh`, exits 1 if the file exists. Migration `20261027120000_transcripts_bucket.sql` (v0.5).
- Postgres 17.6.1.156 (CLI 2.111.0): `pg_default_acl` grants only Dxtm to API roles, so app tables return 42501 for anon/authenticated/service_role until explicit GRANTs exist.
- Local Kong does not validate `apikey`: demo `sb_publishable_`/`sb_secret_` keys pass unmapped and run as anon (400 on storage, never service_role). Demo anon JWT → 401.
