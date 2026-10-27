# Validation: #20 Локальный Supabase на портах 561xx со своими JWT-ключами

## Tools

- Supabase CLI 2.111.0 (`npx supabase`), bash, curl, git
- web: tsc, eslint, vitest; worker: pytest (if `worker/.venv` has it)

## Checklist

- [ ] CLI pinned to 2.111.0 — auto: `npx supabase --version`
- [ ] `supabase/.env` is ignored, example is tracked — auto: `git check-ignore supabase/.env && git ls-files supabase/.env.example`
- [ ] Key script does not overwrite an existing file — auto: run `scripts/supabase-env.sh` twice on a temp copy and compare
- [ ] `config.toml` has no literal secrets, only `env(...)` — auto: `grep -nE 'jwt_secret|publishable_key|secret_key' supabase/config.toml`
- [ ] No secrets in the diff — auto: `git diff origin/staging -- . ':!package-lock.json' | grep -nE 'sb_secret_[A-Za-z0-9]|eyJ[A-Za-z0-9_-]{20,}'` prints nothing
- [ ] Migration creates a public `transcripts` bucket idempotently — auto: review SQL (`ON CONFLICT`)
- [ ] web checks still pass — auto: `cd web && npx tsc --noEmit && npm run lint && npm test`
- [ ] Other Supabase stack is untouched — auto: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:54321/rest/v1/` returns a non-000 code
- [ ] Home stack with real keys: `scripts/supabase-env.sh`, `npx supabase start`, demo anon key → 401, own key → 200, bucket `transcripts` present — manual
- [ ] Home stack without seed data (per readme) — manual

## Smoke tests

- Start the stack on a temp secret, `curl -H "apikey: <demo anon>" http://127.0.0.1:56121/rest/v1/channels` → 401; with the new anon key → 200; `npx supabase stop --no-backup`.
