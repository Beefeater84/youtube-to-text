# SEO Requirements for Transcript Pages

Requirements every transcript page must satisfy. Use this as a checklist during refactors.

## HTML & Meta

- Unique `<title>` containing the transcript title and site name.
- `<meta name="description">` with a meaningful summary (not truncated raw text).
- Canonical URL via `<link rel="canonical">`.
- Open Graph tags: `og:title`, `og:description`, `og:image` (YouTube thumbnail).
- Language attribute on `<html lang="...">`.

## Structured Data

- JSON-LD `Article` schema embedded in the page.
- Required fields: `headline`, `description`, `image`, `author`, `datePublished`, `publisher`.

## Content & Headings

- Single `<h1>` per page — the transcript title.
- Sections use `<h2>` with clean text (no timestamps or markup in the heading content).
- Heading IDs for anchor linking (generated from heading text, lowercase, hyphenated).

## Rendering

- All transcript content rendered as server HTML (SSG/ISR) — not client-only.
- No JavaScript required to read the transcript text.
- ISR revalidation: 24 hours for transcript pages.

## Sitemap & Crawling

- Dynamic `sitemap.xml` includes all published transcript slugs.
- `robots.txt` allows crawling of transcript pages.
- `generateStaticParams` pre-generates slugs at build time.

## Performance

- No heavy client-side JavaScript on the critical reading path.
- YouTube embed loaded as iframe (does not block page render).
- Transcript markdown fetched at build/request time, not on the client.

## URLs

- Clean, readable slugs: `/transcripts/{slug}`.
- No query parameters required to view content.
- Trailing slashes consistent (Next.js default: no trailing slash).
