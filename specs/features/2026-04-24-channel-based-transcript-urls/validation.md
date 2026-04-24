# Validation: Channel-Based Transcript URLs

## Libraries & Tools

- TypeScript compiler (`tsc --noEmit`) — type correctness
- Next.js build (`next build`) — SSG param generation, no broken static paths
- `grep` / IDE search — confirm zero remaining `/transcripts/` hrefs in source

## Scorecard

- [ ] `app/transcripts/[slug]/` folder no longer exists
- [ ] `app/[channelSlug]/[transcriptSlug]/page.tsx` exists and renders correctly
- [ ] `generateStaticParams` returns objects with `channelSlug` + `transcriptSlug`
- [ ] `getTranscript` (or equivalent) accepts channel + transcript slug pair
- [ ] No internal links pointing to `/transcripts/...` remain in codebase
- [ ] Sitemap entries use `/{channel-slug}/{transcript-slug}` pattern
- [ ] `canonical` tag in transcript page uses new URL
- [ ] `hreflang` alternate tags use new URL pattern
- [ ] `next build` completes without errors
- [ ] `tsc --noEmit` passes

## Smoke Tests

```bash
# Build succeeds and static params generate
cd web && npm run build

# No old transcript hrefs remain
grep -r "/transcripts/" web/app web/components web/lib --include="*.tsx" --include="*.ts"
# Expected: zero matches

# Spot-check a rendered page (replace slugs with real values from DB)
curl -s http://localhost:3000/{channel-slug}/{transcript-slug} | grep '<h1>'

# Sitemap includes new URL pattern
curl -s http://localhost:3000/sitemap.xml | grep -v '/transcripts/' | grep 'http'
```
