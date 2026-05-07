# Tech Stack

## Languages & Frameworks

| Layer | Technology |
|-------|-----------|
| Web frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Worker | Python 3.12+ |
| Database | Supabase (Postgres 17) |
| Auth | Supabase Auth — Google OAuth only |
| File storage | Supabase Storage (public buckets `transcripts`, `fetch-payloads`) |
| LLM | OpenAI GPT-4o-mini (cleanup, structuring, translation) |
| Transcript source (primary) | Browser extension via YouTube `timedtext` API (user's session) |
| Transcript source (fallback) | yt-dlp (Python) on VPS, used only when extension is unavailable |
| Browser extension | TypeScript, Manifest V3, Vite, webextension-polyfill (Chrome + Firefox) |

## Infrastructure & Deployment

- **Hosting:** self-hosted VPS / VDS via Docker Compose.
- **Services:** `next-app`, `worker` (Python), reverse proxy (Caddy).
- **CI/CD:** GitHub Actions — `.github/workflows/deploy.yml`.
- **Environments:** local (Supabase CLI + Docker), production (VPS).
- **Local Supabase:** Studio `:54323`, API `:54321`, DB `:54322`.
- **Browser extension:** built via `pnpm --filter extension build` → produces `dist/chrome/` and `dist/firefox/`. Distributed through Chrome Web Store and Firefox Add-ons.

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
| `fetch_payload_path` | Storage path of pre-fetched payload from browser extension (nullable) |

### `profiles`
Auto-created on first login via DB trigger. Key fields: `id` (FK → `auth.users`), `display_name`, `avatar_url`, `preferred_languages`.

### `tags` / `channel_tags`
`tags`: `name`, `slug`. `channel_tags`: junction table `(channel_id, tag_id)`. Both publicly readable.

### RLS Summary
- Channels, transcripts, tags: public read; insert/update restricted to authenticated owner.
- Profiles: read/update own row only.

### Job statuses
`pending`, `queued`, `processing`, `done`, `failed`, `waiting_dependency`, `awaiting_browser_fetch`.

`awaiting_browser_fetch` — created by the dashboard form when the user is expected to fetch via the browser extension. After `EXTENSION_TIMEOUT_MINUTES`, a recovery RPC moves the row back to `pending` so the legacy yt-dlp worker picks it up.

## Browser Extension

- **Code location:** `extension/` (TypeScript, Vite, webextension-polyfill).
- **Manifest:** V3, separate manifests for Chrome (`service_worker`) and Firefox (`background.scripts` quirk).
- **Permissions:** `storage`, `identity`, host permissions for `*.youtube.com` and the production web origin.
- **Auth:** Supabase Google OAuth via popup; JWT stored in `chrome.storage.local`.
- **Fetch source:** `https://www.youtube.com/api/timedtext` (json3 format), called with the user's own browser cookies.
- **API contract:** see `extension/src/shared/types.ts` (shared with web).
- **Trigger model:**
  - User clicks an injected "Save transcript" button on a YouTube watch page.
  - Or auto-trigger via `?yt2text_job=<id>` query param (deep-link from dashboard).

## Key Flows

### Transcript creation (extension path — primary)
`POST /dashboard (form submit)` → Server Action `submit-job` → insert `transcripts` row (`status=awaiting_browser_fetch`) → response includes `youtubeDeepLink` → form opens YouTube in new tab with `?yt2text_job=<id>` → extension content script auto-triggers → background worker fetches `timedtext` with user cookies → `POST /api/extension/submit-fetch` → server uploads payload JSON to Storage (`fetch-payloads/{video_id}/{lang}.json`), sets `status=queued`, records `fetch_payload_path` → worker picks job, loads payload, skips fetch step → enrich DB → LLM cleanup → generate `.md` → upload to Storage → `status=done`.

### Transcript creation (legacy path — fallback)
If `status=awaiting_browser_fetch` lingers longer than `EXTENSION_TIMEOUT_MINUTES`, a recovery RPC flips it to `pending`. The Python worker then runs `fetch_transcript` via yt-dlp with `YOUTUBE_COOKIES_*` (server cookies). Same downstream pipeline.

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
- YouTube fetching on the VPS runs in fallback mode only — do not scale it as the primary path.
- Browser extension must not embed any service-role Supabase keys; only user JWTs.
