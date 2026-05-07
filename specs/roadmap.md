# Roadmap

<!-- Living document. Update after each phase. -->

## Phase 0: Bootstrap
**Status:** Done
**Goal:** Project skeleton, design system, infrastructure.
**Delivered:**
- Next.js 16 + React 19 + Tailwind 4 (`web/`, App Router, FSD structure).
- Docker Compose for prod: Caddy + web + worker.
- CI/CD: `.github/workflows/deploy.yml`.
- Design system: Brutalism + Old Newspaper (CSS theme, fonts, prose styles).

## Phase 1: v0.1 — SEO Core & Public Reading
**Status:** Done
**Goal:** Public transcript pages visible to search engines.
**Delivered:**
- SSG/ISR pages: `/`, `/transcripts/[slug]`, `/channels/[slug]`.
- SEO: sitemap, robots, canonical, `generateMetadata`, JSON-LD Article schema.
- Markdown rendering from Supabase Storage URL.
- Initial DB migrations: `channels`, `transcripts`, `tags`, `channel_tags`.

## Phase 2: v0.2 — Auth & Job Submission
**Status:** Done
**Goal:** Registered users can submit YouTube URLs for processing.
**Delivered:**
- Google OAuth via Supabase Auth.
- `profiles` table with auto-create trigger.
- `/dashboard` (protected), `/login`, `/auth/callback`.
- Transcript creation form (URL + language picker, EN always included).
- Job status badges: `pending / queued / processing / done / failed`.

## Phase 3: v0.3 — Worker Pipeline
**Status:** Done
**Goal:** End-to-end automated transcript processing.
**Delivered:**
- Python worker with yt-dlp (replaced unreliable Node.js library).
- Pipeline: fetch transcript → enrich DB metadata → LLM cleanup/structure → generate `.md` → upload to Storage.
- Postgres-as-queue (no Redis), stale job recovery, retry logic.
- Worker fields: `retry_count`, `error_message`, `started_at`.

## Phase 4: v0.4 — Homepage: Real Data & Pagination
**Status:** Done
**Goal:** Replace mock data on homepage with real Supabase data; one card per video with language badges.
**Features:**
- `VideoGroup` type: one entry per `youtube_video_id` with `languages[]` array.
- `getLatestVideoGroups(page, pageSize)` — paginated, grouped, EN-first.
- `getTopChannels(5)` and `getTopTags(5)` for sidebar.
- `TranscriptCard` component with language badges.
- `Pagination` component (URL-based `?page=N`, SSR-compatible).
- Remove all mock data from `app/page.tsx`.

## Phase 5: v0.5 — Multi-language & Deploy
**Status:** Done
**Goal:** Multi-language transcript generation; production deployment.
**Features:**
- Worker produces translations as separate job branches.
- Translation pages with `hreflang` and self-referencing canonical.
- Dashboard groups language versions under one video.
- VPS deployment hardened and documented.

## Phase 6: v0.6 — Browser Extension Fetcher
**Status:** Planned
**Goal:** Browser extension fetches YouTube transcripts in the user's own browser; VPS worker becomes a fallback only.
**Features:**
- Chrome + Firefox extension (Manifest V3, TypeScript, Vite, webextension-polyfill).
- "Save transcript" button injected on YouTube watch pages; auto-trigger via `?yt2text_job=<id>` deep-link from the dashboard.
- Supabase Google OAuth in extension popup; JWT in `chrome.storage.local`.
- New API routes: `POST /api/extension/submit-fetch`, `GET /api/extension/jobs/by-video`, `/auth/extension-callback`.
- Worker skips `fetch_transcript` when `fetch_payload_path` is set on the job.
- DB: new status `awaiting_browser_fetch`, new column `fetch_payload_path`, recovery RPC that flips stale rows to `pending` for the legacy yt-dlp fallback.

## Phase 7: v0.7 — Token Ledger (No Real Payments)
**Status:** Planned
**Goal:** Internal credit system gating transcript creation.
**Features:**
- Token ledger (debit/credit per processing job).
- Job submission blocked when balance is zero.
- Admin top-up capability.

## Phase 8: v0.8 — Real Payments
**Status:** Planned
**Goal:** Users can purchase tokens.
**Features:**
- Stripe or LemonSqueezy integration.
- Webhook handling for payment confirmation.
- Token top-up on successful payment.

## Phase 9: v0.9 — Semantic Search (Beta)
**Status:** Planned
**Goal:** Search transcript corpus by meaning.
**Features:**
- Index transcripts into a vector store.
- Semantic search with filters (channel, tags).
- "Ask a question, get relevant clips" UX.

## Backlog (unscheduled)

- **Observability:** Sentry for worker errors; Healthchecks.io heartbeat.
- **Improved LLM prompt:** Better section structuring and ad removal after multi-language is stable.
- **Website-to-markdown ingestion:** Extend pipeline beyond YouTube.
- **Research report ingestion:** PDF/HTML report processing.
