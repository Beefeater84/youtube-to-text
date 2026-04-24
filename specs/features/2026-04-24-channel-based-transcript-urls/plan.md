# Plan: Channel-Based Transcript URLs

**Phase:** SEO Improvement (post v0.5, pre v0.6)
**Branch:** feature/channel-based-transcript-urls
**Status:** planning

## Goal

Replace `/transcripts/[slug]` with `/[channel-slug]/[transcript-slug]` so that low-quality articles from one channel cannot pessimize transcripts from other channels.

## Task Groups

### Group 1: Update Next.js routing
- Remove `app/transcripts/[slug]/` route folder
- Create `app/(transcripts)/[channelSlug]/[transcriptSlug]/` route folder (Route Group — keeps dynamic segments isolated, static pages like `/dashboard` always win)
- Update `generateStaticParams` to return `{ channelSlug, transcriptSlug }` pairs (join `transcripts` with `channels`)
- Update `getTranscript` query to accept both `channelSlug` and `transcriptSlug`
- Update page component props accordingly

### Group 2: Update all internal links
- `TranscriptCard` component — href update
- Channel page (`/channels/[slug]`) transcript list links
- Dashboard transcript list links
- Any other `href="/transcripts/..."` occurrences

### Group 3: Update SEO metadata
- `canonical` URL in transcript page `generateMetadata`
- `hreflang` alternate URLs (multi-language variants)
- Sitemap (`sitemap.ts` / `sitemap.xml` generation) — new URL pattern
- JSON-LD Article `url` field

## Key Decisions
- No redirect from old URLs — old `/transcripts/[slug]` route is deleted outright (deliberate SEO reset choice)
- DB slug fields unchanged — this is purely a routing/URL change
- Channel slug sourced from `channels.slug` which is already guaranteed English by mission rules
- DB migration of transcript slugs is a separate future feature
- Route Group `(transcripts)` isolates dynamic `[channelSlug]/[transcriptSlug]` segments — all future service pages (`/about`, `/pricing`, etc.) must be created as static folders outside this group
