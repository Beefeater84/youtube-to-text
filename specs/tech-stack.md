# Tech Stack

## Languages & Frameworks

| Layer | Technology |
|-------|-----------|
| Web | Next.js 16 (App Router), React 19, TypeScript (strict), in `web/` |
| Web structure | Feature-Sliced Design: `app/`, `widgets/`, `features/`, `entities/`, `shared/`, `libs/` |
| Styling | Tailwind CSS v4; design system in `design-system/youtube-to-text/MASTER.md` |
| Web tests | Vitest + Testing Library (jsdom) |
| Worker | Python 3.12+, in `worker/` |
| Worker tests | pytest + pytest-mock |
| Database | Supabase (Postgres 17), migrations in `supabase/migrations/` |
| Auth | Supabase Auth, Google OAuth only |
| File storage | Supabase Storage, public bucket `transcripts` |
| LLM | OpenAI `gpt-4o-mini` (cleanup, structuring, translation) |
| Transcript source | yt-dlp |

## Infrastructure & Deployment

**Target setup (migration in progress, epic #19):**
- **web/** on **Vercel** (free tier), Root Directory `web/`, domain `yt-reader.com`.
- **Supabase** runs locally via Supabase CLI on the home machine (WSL2, host `home-dev`), on its own ports and with its own JWT secret and keys.
- Only the Supabase API (Kong) is exposed, through **Tailscale Funnel**. Studio, Postgres and Inbucket stay private.
- **worker/** runs on the same home machine in Docker (`restart: unless-stopped`). It only polls Supabase, no inbound ports.
- Always-on via systemd units in WSL.

**Legacy (VDS, switched off, to be removed by #27):**
- `deploy/docker-compose.prod.yml` (Caddy + web + worker), `deploy/Caddyfile`, `deploy/scripts/*`.
- `.github/workflows/deploy.yml` builds images to GHCR and deploys to the VDS on push to `main`.
- `.github/workflows/failed-jobs-alert.yml` is manual-only (schedule disabled).

**Environments:** local development (Supabase CLI + Docker) and production (Vercel + home machine). Local Supabase uses the `561xx` port range instead of the CLI default `543xx` (API `56121`, DB `56122`, Studio `56123`), so it can run next to other Supabase CLI projects on the same machine. There is no CI workflow for checks; run them locally.

**Environment variables:**
- web: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- worker: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`; optional `POLL_INTERVAL_MS` (5000), `STALE_MINUTES` (15), `MAX_RETRIES` (3), `YOUTUBE_COOKIES_FILE`, `YOUTUBE_COOKIES_CONTENT`.

## Key Dependencies

- `@supabase/ssr`, `@supabase/supabase-js` — Supabase clients for Next.js (`web/libs/supabase`). No generated DB types; row types live in `entities/*/model/types.ts`.
- `react-markdown`, `remark-gfm`, `gray-matter` — Markdown rendering and frontmatter.
- `lucide-react` — icons.
- `yt-dlp` — transcript and metadata extraction.
- `openai` — LLM pipeline.
- `supabase` (Python) — worker DB and Storage client.
- `Unidecode` — transliteration for slugs.
- `python-dotenv` — worker env config.

## Database Schema

### `channels`
One row per YouTube channel. Key fields: `youtube_id`, `title` (English), `description`, `slug` (English), `thumbnail_url`.

### `transcripts`
One row per video per language. Unique `(youtube_video_id, language)` and unique `slug`.

| Field | Purpose |
|-------|---------|
| `youtube_video_id` | YouTube video ID |
| `channel_id` | FK → `channels` |
| `user_id` | FK → `auth.users`, nullable, who submitted the job |
| `title`, `description`, `thumbnail_url` | Video metadata |
| `slug` | URL-safe English identifier |
| `language` | Language code (`en`, `ru`, …) |
| `duration_seconds` | Video length |
| `markdown_url` | Public URL of the `.md` file in Storage |
| `status` | `pending`, `queued`, `processing`, `done`, `failed`, `waiting_dependency` |
| `retry_count`, `error_message`, `started_at` | Worker bookkeeping, stale detection |
| `published_at`, `created_at`, `updated_at` | Timestamps |

### `profiles`
Created on first login by the `handle_new_user` trigger. Key fields: `id` (FK → `auth.users`), `display_name`, `avatar_url`, `preferred_languages`.

### `tags` / `channel_tags`
`tags`: `name`, `slug`. `channel_tags`: junction `(channel_id, tag_id)`. Publicly readable.

### RPC functions
`grab_pending_transcript()` (EN first, `SKIP LOCKED`), `increment_retry_and_fail(...)`, `recover_stale_jobs(...)`, `wake_dependent_jobs(video_id)`.

### RLS
- Channels, transcripts, tags: public read; insert/update for the authenticated owner.
- Profiles: read/update own row only.
- The worker uses the service role key and bypasses RLS.

## Key Flows

### Transcript creation
Dashboard form → Server Action in `web/features/create-transcript` → insert `transcripts` rows (`status=pending`, EN always included) → worker polls every 5 s → `grab_pending_transcript` → `worker/src/pipeline/run.py`:
- EN job: fetch subtitles and metadata via yt-dlp → enrich DB (title, slug, channel) → LLM cleanup and structuring → generate `.md` → upload to Storage → `status=done`, set `markdown_url` → `wake_dependent_jobs`.
- Non-EN job: if the EN version is done, translate its Markdown; otherwise create the EN dependency if needed and set `waiting_dependency`.
- On error: `increment_retry_and_fail` (up to 3 retries).

### Public transcript page
`GET /{channelSlug}/{transcriptSlug}` (`web/app/(transcripts)/[channelSlug]/[transcriptSlug]/page.tsx`) → `generateStaticParams` → load transcript row → fetch `markdown_url` → render Markdown on the server → ISR revalidate 24 h. Home and channel pages revalidate every hour.

### Markdown contract
Format of the `.md` files between worker and web: `docs/transcript-format.md`.

## Checks

```bash
cd web && npm ci
cd web && npx tsc --noEmit
cd web && npm run lint
cd web && npm test
cd worker && python3 -m venv .venv && .venv/bin/pip install -e '.[dev]'
cd worker && .venv/bin/pytest
```

## Smoke Tests

```bash
# Production build of web renders key pages
cd web && npm run test:build

# Public transcript page renders without JS
curl -s https://yt-reader.com/<channel-slug>/<transcript-slug> | grep '<h1'

# Sitemap includes the new transcript
curl -s https://yt-reader.com/sitemap.xml | grep '<transcript-slug>'

# Worker: submit a URL in /dashboard, watch status go pending → processing → done,
# and check that the .md file appears in the `transcripts` bucket.
```

## Constraints

- Next.js request handlers and Server Actions must not run LLM or translation work. They only insert jobs; the worker does the rest.
- Transcript text never goes into Postgres, only Storage.
- Transcript, channel and home pages stay SSG/ISR.
- Schema changes only through new files in `supabase/migrations/`. Create migrations; do not apply them to production from an agent.
- Worker Docker image is based on `python:3.12-slim`.
- ESLint: no `any` (`@typescript-eslint/no-explicit-any` is an error).
