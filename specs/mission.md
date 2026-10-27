# Mission

## Vision

Turn YouTube videos into clean, readable Markdown, optimised for humans and LLMs alike.
The service lets anyone read video content faster than watching it, and builds a searchable knowledge base from trusted sources (videos now; research reports and websites later).

## Target Audience

- **Readers (anonymous):** anyone who wants to read a video transcript without an account. Main traffic source is SEO. UI only.
- **Creators (registered):** users who submit YouTube URLs to generate new transcripts. Must sign in with Google. UI only (dashboard form); there is no public API.
- **Future: power users** who pay tokens for bulk processing and semantic search.

## Core Business Rules

- Reading is free and public, no auth required. All transcript and channel pages are publicly accessible.
- Creating transcripts requires a signed-in account.
- One row in `transcripts` per (video, language). Each language is a separate `.md` file at `transcripts/{videoId[0:2]}/{videoId}/{lang}.md`.
- English is always the base language. A job always includes `en`. Non-EN versions are translated from the EN Markdown, not from the raw subtitles.
- Job statuses: `pending → processing → done / failed`, plus `waiting_dependency` (non-EN job waiting for its EN version) and `queued` (allowed by the schema).
  - The worker grabs EN jobs before non-EN ones (`grab_pending_transcript`).
  - When an EN job is done, `wake_dependent_jobs` moves its `waiting_dependency` siblings back to `pending`.
  - Max retries: 3 (`MAX_RETRIES`). Jobs stuck in `processing` for more than 15 minutes (`STALE_MINUTES`) are recovered by `recover_stale_jobs`.
  - A video with no subtitles fails with `No subtitles found` (see `worker/agent.md` for all use cases).
- Listings show one card per video. All available languages are shown as badges, `EN` first. The EN title and slug are preferred when they exist.
- Channel names and slugs are stored in English (translated or transliterated by the worker).
- Slugs are URL-safe English. Transcript URL: `/{channelSlug}/{transcriptSlug}`. Channel URL: `/channels/{slug}`.
- Each language page has a self-referencing canonical and `hreflang` links to the other language versions.
- The LLM step strips ads, sponsored segments and filler.
- Each section stores its start timestamp so the reader can jump to that moment in the original video.

## Key Decisions

- **Storage** — transcript text in Supabase Storage (public bucket `transcripts`), not in Postgres — cost, CDN, decoupling. URLs are deterministic from `videoId` + `lang`.
- **Auth** — Google OAuth only via Supabase Auth — simplest SSO, no password management.
- **Worker language** — Python + yt-dlp, not Node.js — yt-dlp is the most reliable transcript and metadata source; the original Node.js library was unreliable.
- **Queue** — Postgres as the queue (`FOR UPDATE SKIP LOCKED`), no Redis — less infrastructure.
- **Rendering** — SSG/ISR server rendering of transcript text — SEO is the main traffic source.
- **LLM** — OpenAI `gpt-4o-mini` for cleanup, structuring and translation — cheap enough for high-volume text.
- **Hosting** — web on Vercel, worker and Supabase on a home machine — YouTube blocks requests from datacenter IPs, so the worker must run from a residential IP. Replaces the VDS setup (epic #19).
- **Frontend structure** — Feature-Sliced Design layers in `web/` (`app`, `widgets`, `features`, `entities`, `shared`).

## Scope

**In scope:**
- YouTube video → clean Markdown transcript pipeline.
- Multi-language transcripts (EN always produced, other languages on request).
- SEO-optimised public transcript and channel pages, sitemap.
- User dashboard with job status tracking.

**Direction (next, not started):**
- Token ledger gating transcript creation, then real payments for tokens.
- Semantic search over the transcript corpus with channel and tag filters.

**Out of scope (now):**
- Research report ingestion.
- Website-to-markdown conversion.
- Public API for creating transcripts.

## Constraints

- One developer maintains the project. Prefer simple solutions and minimal infrastructure.
- YouTube blocks datacenter IPs. The worker must run from a residential IP (home machine); cookies via `YOUTUBE_COOKIES_FILE` / `YOUTUBE_COOKIES_CONTENT` when needed.
- Long-running LLM and translation work runs only in the worker, never in Next.js request handlers (serverless timeouts).
- Never store full transcript text in Postgres.
- Content pages stay SSG/ISR. No client-only rendering of transcript text.
