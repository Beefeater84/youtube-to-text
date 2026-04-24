# Plan: Production Build Smoke Tests

**Phase:** DevEx / Quality (cross-cutting, no roadmap phase)
**Branch:** feature/production-build-smoke-tests
**Status:** planning

## Goal

A single local command (`npm run test:build`) that builds the app in production mode, starts the server, and verifies all key pages return HTTP 200 with no runtime errors.

## Task Groups

### Group 1: Smoke test script
- Create `web/scripts/smoke-test-build.mjs` (Node ESM, no extra deps)
- Step 1 — run `npm run build`; fail fast if exit code != 0
- Step 2 — spawn `npm run start` in background; poll `GET /` until ready (max 30s)
- Step 3 — fetch `/sitemap.xml`, extract all `<loc>` URLs via regex
- Step 4 — add static pages not in sitemap: `/login`
- Step 5 — for each URL: assert HTTP status 200; assert body does NOT contain `DYNAMIC_SERVER_USAGE`, `Internal Server Error`, `Application error`
- Step 6 — kill the server; print pass/fail summary; exit 1 if any check failed

### Group 2: npm script
- Add `"test:build": "node scripts/smoke-test-build.mjs"` to `web/package.json`

## Key Decisions
- Sitemap-driven URL discovery — no hardcoded slugs; script tests whatever the build actually generated
- Static pages added manually — `/login` is not in sitemap but must return 200
- No extra packages — Node 18+ built-in `fetch` + `child_process` + regex XML parse
- Script lives in `web/scripts/` — co-located with the Next.js app, not a separate test suite
- Exit code 1 on any failure — makes it easy to add to CI later
