# Tech Stack

## Languages & Frameworks

| Layer | Technology |
|-------|-----------|
| Web frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Worker | Python 3.12+ |
| Database | Supabase (Postgres 17) |
| Auth | Supabase Auth — Google OAuth only |
| File storage | Supabase Storage (public bucket `transcripts`) |
| LLM | OpenAI GPT-4o-mini (cleanup, structuring, translation) |
| Transcript source | yt-dlp (Python) |

## Infrastructure & Deployment

- **Hosting:** self-hosted VPS / VDS via Docker Compose.
- **Services:** `next-app`, `worker` (Python), reverse proxy (Caddy).
- **CI/CD:** GitHub Actions — `.github/workflows/deploy.yml`.
- **Environments:** local (Supabase CLI + Docker), production (VPS).
- **Local Supabase:** Studio `:54323`, API `:54321`, DB `:54322`.

## Key Dependencies

- `@supabase/ssr`, `@supabase/supabase-js` — Supabase client for Next.js (SSR-aware).
- `yt-dlp` — YouTube transcript and metadata extraction.
- `openai` — LLM pipeline (cleanup, translation).
- `gray-matter` — frontmatter parsing for `.md` files.
- `react-markdown`, `remark-gfm` — Markdown rendering in the browser.
- `python-dotenv` — environment config in worker.
- `Unidecode` — transliteration for non-English channel slugs.

## Database Schema

### `channels`
One row per YouTube channel. Key fields: `youtube_id`, `title` (English), `slug` (English), `thumbnail_url`.

### `transcripts`
One row per video per language. Key fields:

| Field | Purpose |
|-------|---------|
| `youtube_video_id` | YouTube video ID |
| `channel_id` | FK → `channels` |
| `user_id` | FK → `auth.users` (nullable, who submitted the job) |
| `slug` | URL-safe identifier (English) |
| `language` | Language code (`en`, `ru`, …) |
| `duration_seconds` | Video length in seconds |
| `markdown_url` | Full public URL to `.md` file in Storage |
| `status` | `pending → queued → processing → done / failed` |
| `retry_count` | Number of retry attempts |
| `error_message` | Last failure message |
| `started_at` | When worker picked up the job (for stale detection) |
| `published_at` | When transcript became publicly available |

### `profiles`
Auto-created on first login via DB trigger. Key fields: `id` (FK → `auth.users`), `display_name`, `avatar_url`, `preferred_languages`.

### `tags` / `channel_tags`
`tags`: `name`, `slug`. `channel_tags`: junction table `(channel_id, tag_id)`. Both publicly readable.

### RLS Summary
- Channels, transcripts, tags: public read; insert/update restricted to authenticated owner.
- Profiles: read/update own row only.

## Key Flows

### Transcript creation
`POST /dashboard (form submit)` → Server Action `submit-job` → insert `transcripts` row (`status=pending`) → worker polls → `grab_pending_transcript` RPC → fetch metadata via yt-dlp → enrich DB (title, slug, channel, thumbnail) → LLM cleanup/structure → generate `.md` → upload to Storage → update `status=done`, set `markdown_url`.

### Public transcript page render
`GET /transcripts/[slug]` → `generateStaticParams` at build time → `getTranscript(slug)` → fetch `markdown_url` → render Markdown server-side → ISR revalidate 24h.

### File path convention
```
transcripts/{videoId[0:2]}/{videoId}/{lang}.md
```
Example: `transcripts/Id/IdoVd4XHbDE/en.md`

## Smoke Tests

```bash
# Worker picks up a job
curl -X POST /api/submit-job -d '{"url":"https://youtu.be/..."}'
# Check status transitions: pending → done in DB
# Verify .md file appears in Supabase Storage

# Public page renders without JS
curl https://yourdomain.com/transcripts/some-slug | grep '<h1>'

# Sitemap includes the new slug
curl https://yourdomain.com/sitemap.xml | grep 'some-slug'
```

## Constraints

- Next.js API routes must not run long-running LLM/translation work — delegate to worker.
- Transcript text must never be stored in Postgres — Storage only.
- All content pages must be SSG/ISR — no client-only rendering of transcript text.
- Worker Docker image: `python:3.12-slim` (keep image small).
