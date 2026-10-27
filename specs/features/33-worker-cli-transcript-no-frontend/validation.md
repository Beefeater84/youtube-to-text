# Validation: #33 CLI воркера: создать транскрипт без фронтенда

## Tools

- pytest (worker/.venv), python -m src.cli --help

## Checklist

- [ ] Worker test suite is green — auto: `cd worker && .venv/bin/pytest`
- [ ] CLI help works without a live stack — auto: `cd worker && SUPABASE_URL=http://localhost:1 SUPABASE_SERVICE_ROLE_KEY=x OPENAI_API_KEY=x .venv/bin/python -m src.cli --help`
- [ ] Invalid input exits 2 — auto: `cd worker && SUPABASE_URL=http://localhost:1 SUPABASE_SERVICE_ROLE_KEY=x OPENAI_API_KEY=x .venv/bin/python -m src.cli not-a-video; test $? -eq 2`
- [ ] No migrations added — auto: `git diff --name-only origin/staging -- supabase/migrations` prints nothing
- [ ] No secrets in the diff — auto: `git diff origin/staging | grep -nE 'sk-[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9]'` prints nothing
- [ ] web unaffected — auto: `cd web && npx tsc --noEmit && npm run lint && npm test`
- [ ] Wait mode with a running worker produces done and saves Markdown — manual: start the stack and `cd worker && .venv/bin/python -m src.main`, then `.venv/bin/python -m src.cli <url> --out /tmp/x.md`
- [ ] `--inline` EN without a worker — manual: `.venv/bin/python -m src.cli <url> --inline --out x.md`
- [ ] Repeat run returns immediately without a duplicate — manual
- [ ] Video without subtitles exits non-zero with `No subtitles found` — manual

## Smoke tests

- `python -m src.cli <url> --inline --out transcript.md` on one real video; file starts with the transcript frontmatter.
