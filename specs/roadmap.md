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
**Status:** Cancelled

**Reason:** YouTube does not return subtitles via the `timedtext` API when called from an extension context, even with an authenticated user session. Multiple days of investigation confirmed the approach is not viable.

## Phase 6.5: v0.6.5 — Residential Proxy Fetcher

**Status:** Planned

**Goal:** Route all yt-dlp and subtitle HTTP requests through Bright Data residential proxies so YouTube sees a home-user IP instead of the VPS datacenter IP; eliminate the bot-detection/CAPTCHA wall on the server.

**Features:**

- Residential proxy (`RESIDENTIAL_PROXY_URL`) wired into yt-dlp opts and urllib subtitle download in `worker/src/pipeline/fetch_transcript.py`.
- Web Unlocker API (`BRIGHT_DATA_WEB_UNLOCKER_TOKEN`, `BRIGHT_DATA_ZONE`) used as fallback for subtitle HTTP fetch when residential proxy alone triggers a challenge.
- New env vars documented in `worker/.env.example`.
- Proxy disabled when env vars are absent (local dev stays unchanged).

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
