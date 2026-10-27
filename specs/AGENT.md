# Agent guide to `specs/`

This file tells agents what to read in `specs/`. `README.md` files are for humans.
Do not read the whole folder. Read the base set, then only what the task needs.

## Always read

- `mission.md` — what the project is and its business rules.
- `tech-stack.md` — stack, infrastructure, constraints, code style.
- Accepted decisions in `decisions/`. List them with:

  ```bash
  grep -rl --include='*.md' '^Status: accepted' specs/decisions/
  ```

  Read the title, `Affects` and `Decision` of each. Read the rest only if the task touches it.

## Read by topic

| When the task touches | Read |
|---|---|
| Worker pipeline, job statuses, EN dependency, retries | `worker/agent.md` |
| Job submission from the web (Server Action, validation) | `web/features/create-transcript/api/agent.md` |
| Dashboard page, job list, status badges | `web/app/dashboard/agent.md` |
| Format of transcript `.md` files (worker output, web rendering) | `docs/transcript-format.md` |
| Storage bucket, file paths, what lives in DB vs Storage | `docs/data-storage.md` |
| Page metadata, canonical, `hreflang`, sitemap, JSON-LD | `docs/seo-requirements.md` |
| UI, styling, new pages or components | `design-system/youtube-to-text/MASTER.md`, then `design-system/youtube-to-text/pages/<page>.md` if it exists |
| Deployment, hosting, home server, Vercel | `tech-stack.md` → Infrastructure, epic #19 and its sub-issues; `deploy/README.md` describes the legacy VDS setup |
| DB schema, RLS, RPC functions | `supabase/migrations/` (newest file wins) |

## Feature folders

`features/<id>-<slug>/` holds one task's `plan.md`, `context.md` and `validation.md`.
Read only the folder of the current task. Read another one only when the task context points to it.
Older folders named `features/<date>-<slug>/` come from before the GitHub Issues workflow; treat them as history.

## Where decisions go

- Affects only the current task: a deviation comment in its GitHub issue (`## Отклонение от подхода`).
- Changes the approach for other tasks: an ADR in `decisions/<id>-<slug>.md` (template: `.claude/templates/sdd/adr.md`).
- Never edit an accepted ADR. Write a new one and set the old one to `superseded by <file>`.
