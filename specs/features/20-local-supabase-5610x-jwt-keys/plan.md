# Plan: #20 Локальный Supabase на портах 561xx со своими JWT-ключами

Issue: #20 · Approach: https://github.com/Beefeater84/youtube-to-text/issues/20#issuecomment-6443128191
Delivery: -
Later: -

Ports are already done in #31. This delivery covers own keys, the `transcripts` bucket and docs.
Hard constraint: other Supabase stacks run on this machine (`family-shopping-list` 543xx, `learn-finish` 550xx). Nothing here may stop, restart or reconfigure them.

## Group 1: Supabase CLI, own keys and bucket

- Task: #20
- Goal: The local stack starts only with its own JWT secret and publishable/secret keys from an untracked `supabase/.env`, the demo keys are rejected, and migrations create the public `transcripts` bucket.
- Files: `package.json`, `package-lock.json` (change: CLI 2.111.0), `scripts/supabase-env.sh` (create), `supabase/.env.example` (create), `supabase/config.toml` (change: `[auth]` keys via `env(...)` with comments), `supabase/migrations/<ts>_transcripts_bucket.sql` (create)
- Reuse: `env(...)` pattern in `supabase/config.toml` (Google OAuth); root `.gitignore` already ignores `supabase/.env`; `deploy/.env.example` layout
- Done when: on a temporary secret, `npx supabase start` succeeds; `status -o env` shows non-demo keys; REST with the CLI demo anon key returns 401 and with the new anon key returns 200; bucket `transcripts` exists and is public; `curl` to `127.0.0.1:54321` (other stack) still answers; then `npx supabase stop --no-backup` for this project only.
- Complexity: complex

## Group 2: Table grants for API roles

- Task: #20
- Goal: Postgres 17.6 in CLI 2.111.0 no longer grants table privileges to `anon`, `authenticated`, `service_role` by default; a migration restores the classic Supabase grants on schema `public` (tables, sequences, functions, plus default privileges for future objects), so web and worker work while RLS keeps restricting access.
- Files: `supabase/migrations/<ts>_api_role_grants.sql` (create)
- Reuse: style of `supabase/migrations/20261027120000_transcripts_bucket.sql`
- Done when: on a temporary stack, every table in `public` has RLS enabled; anon can read `channels`/`transcripts` but cannot insert; service_role can insert/update `transcripts`; RPC `grab_pending_transcript` works for service_role; stack stopped with `--no-backup`, temporary `supabase/.env` deleted.
- Complexity: complex

## Group 3: Local development docs

- Task: #20
- Goal: Docs describe the one-step key setup, the coexistence with other stacks, port exposure, seed handling for the home stack, where the bucket comes from, the `JWT_SECRET` name (fail-closed) and that demo `sb_` keys act as anon only.
- Files: `readme.md` (change: Local development), `docs/data-storage.md` (change: Bucket Setup), `specs/tech-stack.md` (change: Infrastructure, Environments)
- Reuse: existing Local development section from #31
- Done when: readme steps from a clean clone match group 1 commands; no mention of demo keys being used; no real keys, hosts or IPs.
- Complexity: normal
