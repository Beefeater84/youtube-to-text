# Requirements: Channel-Based Transcript URLs

## Functional Requirements

- Transcript public URL MUST follow the pattern `/{channel-slug}/{transcript-slug}`
- `channel-slug` is sourced from `channels.slug` (already English-only per mission rules)
- `transcript-slug` is the existing `transcripts.slug` value — unchanged
- Old route `/transcripts/[slug]` MUST be removed entirely (no redirect)
- `generateStaticParams` MUST pre-render all channel+transcript slug combinations at build time (SSG)
- ISR revalidation period stays at 24h
- Sitemap MUST use new URL pattern
- `canonical` and `hreflang` tags in transcript page MUST use new URL pattern
- All internal links (cards, channel page, dashboard) MUST point to new URLs
- Channel slug MUST be validated as ASCII/URL-safe before use in path (trust DB constraint, no runtime transform needed)

## Modules & Packages

- No new packages required
- `@supabase/ssr` — existing, for DB queries
- Next.js App Router Route Group + dynamic segments — `(transcripts)/[channelSlug]/[transcriptSlug]`

## Constraints

- TypeScript strict mode — no `any`
- SSG/ISR only — no client-side rendering of transcript text (existing constraint)
- `channels.slug` is the authoritative English slug — do not transliterate at runtime
- DB slug migration (rewriting `transcripts.slug` values) is out of scope
- Do not add a redirect from `/transcripts/[slug]` — deliberate decision
- All future service/marketing pages MUST be created as static route folders outside the `(transcripts)` group to avoid being caught by `[channelSlug]`
