# Task: Transcript Page (`/transcripts/[slug]`)

**Phase:** v0.1 — SEO core & content reading
**Status:** not started
**Depends on:** Supabase local (done), design system (done)

## Goal

Build the transcript page that renders Markdown from storage with timestamped sections and an embedded YouTube player. Clicking a timestamp seeks the video to that moment.

## Markdown File Format

Combo approach: YAML frontmatter + `<!-- t:XXX -->` HTML comments.

```yaml
---
video_id: "IdoVd4XHbDE"
title: "How to Build a Startup"
channel: "Y Combinator"
duration: 3600
language: "en"
sections:
  - title: "Introduction"
    timestamp: 0
  - title: "The Problem"
    timestamp: 155
  - title: "The Solution"
    timestamp: 420
---
```

```markdown
<!-- t:0 -->
## Introduction

Content here...

<!-- t:155 -->
## The Problem

Content here...
```

Frontmatter = structured access (TOC, SEO, JSON-LD).
HTML comments = precise position-to-timestamp mapping in body.
Headings stay clean (no `[0:00]`) for SEO and screen readers.

Storage path per `agent.md`: `transcripts/{videoId[0:2]}/{videoId}/{lang}.md`

## Page Layout

```
┌─────────────────────────────────────┐
│         NEWSPAPER HEADER            │
├─────────────────────────────────────┤
│  Breadcrumb: Home > Channel > Title │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │   Embedded YouTube Player 16:9  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ARTICLE TITLE (h1)                  │
│ Channel · Duration · Date · Lang    │
│ ═══════════════════════════════════ │
│                                     │
│ TABLE OF CONTENTS                   │
│ 0:00  Introduction                  │
│ 2:35  The Problem                   │
│ 7:00  The Solution                  │
│ ─────────────────────────────────── │
│                                     │
│ 0:00 ▸ Introduction                 │
│ Section content...                  │
│                                     │
│ 2:35 ▸ The Problem                  │
│ Section content...                  │
│                                     │
├─────────────────────────────────────┤
│         NEWSPAPER FOOTER            │
└─────────────────────────────────────┘
```

## Components

All files in `web/`:

| File | What | Notes |
|------|------|-------|
| `app/transcripts/[slug]/page.tsx` | Page (Server Component, ISR 24h) | `generateMetadata`, `generateStaticParams`, JSON-LD Article |
| `components/VideoPlayer.tsx` | YouTube IFrame embed | Loads YT IFrame API, exposes `seekTo` |
| `components/VideoPlayerProvider.tsx` | React Context | Shares `seekTo(seconds)` across component tree |
| `components/TableOfContents.tsx` | Section navigation | Server-render from frontmatter; client IntersectionObserver for active section (Compass pattern) |
| `components/MarkdownContent.tsx` | Markdown renderer | `react-markdown` + custom `h2` with TimestampBadge |
| `components/TimestampBadge.tsx` | Clickable timestamp | Adapted from Compass `TimestampButton`; click → seekTo, right-click → YouTube `?t=` link |

## Utilities

| File | What |
|------|------|
| `libs/markdown.ts` | `parseTranscript(raw)` → frontmatter + body; `formatTime(seconds)` → "M:SS" / "H:MM:SS" |
| `libs/data/transcripts.ts` | `getTranscriptBySlug(slug)` from Supabase; `getAllTranscriptSlugs()` for SSG |
| `libs/youtube.ts` | `buildEmbedUrl(videoId)`, `buildTimestampUrl(videoId, seconds)` |
| `libs/utils.ts` | `generateId(text)` for heading anchors (Compass pattern) |

## Dependencies to Add

- `gray-matter` — YAML frontmatter parsing
- `react-markdown` — Markdown to React
- `remark-gfm` — GFM support (tables, strikethrough, autolinks)

## Test Data Strategy

No processing pipeline yet (that's v0.3). For development:

1. Create `web/public/sample-transcripts/` with 2–3 `.md` files in our format.
2. Adapt content from Compass template lessons (`compass-ts/src/data/lessons/`).
3. Update `supabase/seed.sql` to point `markdown_url` at sample files.

## Compass Template Reference (`compass-ts/`)

Patterns to adapt:

- **TOC**: `src/components/table-of-contents.tsx` — IntersectionObserver + sticky sidebar
- **TimestampButton**: `src/components/video-player.tsx` — `formatTime()`, click → seek
- **generateId**: `mdx-components.tsx` — heading text → anchor ID
- **typography**: `src/app/typography.css` — `.prose` styles as reference

Key difference: Compass uses `@next/mdx` (build-time local files). We use `react-markdown` (runtime fetch from S3).

## UX Details

- Timestamp badge always visible (not hover-only — mobile-friendly).
- Style: `font-label` (Special Elite), `ink-ghost` color, `ink` on hover.
- Click badge → seek embedded YouTube player.
- Right-click / Ctrl+click → open YouTube in new tab with `?t=XXX`.
- TOC highlights currently visible section via IntersectionObserver.

## SEO

- `generateMetadata()` — title, description, og:image (thumbnail), canonical.
- JSON-LD `Article` schema from frontmatter + Supabase data.
- `generateStaticParams()` — pre-generate slugs for SSG.
- ISR revalidate: 24h.

## YAGNI (not now)

- Sticky mini-player on scroll.
- Active section highlighting synced with video playback (needs YT API polling — v0.4+).
- Mobile floating player.
- Dark theme.
- Synchronized text-video scroll.

## Steps

1. Create MD format spec + 2–3 sample transcript files.
2. Install `gray-matter`, `react-markdown`, `remark-gfm`; create `libs/markdown.ts`.
3. Create `libs/data/transcripts.ts` + update `seed.sql`.
4. Build `VideoPlayer` + `VideoPlayerProvider` (YouTube IFrame API).
5. Build `MarkdownContent` with custom h2 + `TimestampBadge`.
6. Build `TableOfContents` (server render + client IntersectionObserver).
7. Assemble `/transcripts/[slug]/page.tsx` — SEO, ISR, layout.
8. Style everything to newspaper design (`.prose-newspaper`, rules, dropcap).
