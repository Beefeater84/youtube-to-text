# Mission

## Vision

Turn YouTube videos into clean, readable Markdown — optimised for humans and LLMs alike.
The service lets anyone read video content faster than watching it, and builds a searchable knowledge base from trusted sources (videos, research reports, websites).

## Target Audience

- **Readers (anonymous):** anyone who wants to read a video transcript without an account. Primary traffic source is SEO.
- **Creators (registered):** users who submit YouTube URLs to generate new transcripts. Must be authenticated to create jobs.
- **Future: power users** who pay tokens for bulk processing and semantic search.

## Core Business Rules

- Reading is free and public — no auth required. All transcript pages are publicly accessible.
- Creating transcripts requires a registered account.
- Every video can have multiple language versions; each is a separate `.md` file at `transcripts/{shard}/{videoId}/{lang}.md`.
- One card per video in listings — all available languages shown as badges, `EN` sorted first.
- English is always the base language. Channel names and slugs are stored in English (transliterated if necessary).
- Slugs must be URL-safe and in English; non-English originals use transliteration (e.g. `/ru/kak-vybrat-noutbuk`).
- Each translated page has self-referencing canonical and `hreflang` tags pointing to other language versions.
- Ads and filler content are stripped from transcripts by the LLM pipeline step.
- Timestamps are stored per section so users can jump to that moment in the original video.
- Worker pipeline statuses: `pending → queued → processing → done / failed`. Max retries: 3. Stale jobs (>15 min in `processing`) are recovered automatically.

## Key Decisions

- **Storage** — transcript text in Supabase Storage (S3-compatible), not in Postgres. Reason: cost, CDN, and decoupling.
- **Auth** — Google OAuth only via Supabase Auth. Reason: simplest SSO, no password management.
- **Worker language** — Python + yt-dlp (not Node.js). Reason: yt-dlp is the most reliable transcript/metadata source (150k+ stars); original Node.js library was unreliable.
- **Queue** — Postgres-as-queue (`FOR UPDATE SKIP LOCKED`), no Redis. Reason: reduces infrastructure complexity; Redis removed after v0.3.
- **Rendering** — Server-side (SSG/ISR), no client-only transcript rendering. Reason: SEO is the primary traffic source.
- **LLM** — OpenAI GPT-4o-mini for cleanup, structuring, and translation. Reason: cost-effective for high-volume text processing.

## Scope

**In scope:**
- YouTube video → clean Markdown transcript pipeline.
- Multi-language support (EN always produced; other languages on request).
- SEO-optimised public transcript and channel pages.
- User dashboard with job status tracking.
- Token-based monetisation (future).
- Semantic search over transcript corpus (future).

**Out of scope (current):**
- Research report ingestion.
- Website-to-markdown conversion (planned, not started).
- Real payment processing (planned for v0.7).

## Constraints

- Serverless function timeouts — long-running LLM/translation steps must run in the worker process, not in the Next.js API layer.
- Postgres storage costs — never store full transcript text in the database.
- SEO regression risk — content pages must remain SSG/ISR; no client-only rendering of transcript text.
