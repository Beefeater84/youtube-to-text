# Status: Browser Extension Fetcher

## 6.1 — Backend foundation ✅ Done

All items merged and validated on `replan/browser-extension`.

- DB migrations: `awaiting_browser_fetch` status, `fetch_payload_path` column, updated `grab_pending_transcript` RPC, `recover_browser_stale_jobs` RPC, `fetch-payloads` bucket.
- `POST /api/extension/submit-fetch` — auth, ownership check, storage upload, status transition.
- `GET /api/extension/jobs/by-video` — returns pending jobs for a video.
- `GET /api/extension/jobs/recent` — returns last 5 jobs (popup).
- Worker: `load_fetched_payload`, payload-skip branch in `_run_en_pipeline`, `recover_browser_stale_jobs` call in main loop.
- Dashboard: `awaiting_browser_fetch` badge, `youtubeDeepLink` in submit response, `window.open` on success.

## 6.2 — Chrome extension 🔄 In validation

Implementation complete on `replan/browser-extension`.

### What was built

| File | Purpose |
|---|---|
| `extension/manifests/chrome.json` | MV3 manifest — `service_worker`, content script on `youtube.com/watch*`, permissions: `storage`, `identity`, `activeTab`, `scripting` |
| `extension/src/lib/auth.ts` | JWT storage, auto-refresh, OAuth URL builder |
| `extension/src/lib/api.ts` | `submitFetch`, `getJobsByVideo` with bearer auth |
| `extension/src/lib/youtube/timedtext.ts` | Reads `ytInitialPlayerResponse`, picks best caption track, fetches json3, parses to `RawSegment[]` |
| `extension/src/background/index.ts` | `FETCH_AND_SUBMIT` handler; uses `scripting.executeScript` to run fetch inside the YouTube tab |
| `extension/src/content/youtube.tsx` | Injects "Save transcript" button via Preact; auto-triggers on `?yt2text_job=` |
| `extension/src/popup/main.tsx` | Login/logout, recent jobs list |
| `web/app/auth/extension-callback/page.tsx` | Reads tokens from URL hash, `postMessage` to popup opener |

### Validation checklist (6.2)

- [x] `npm run build:chrome` passes clean
- [x] `tsc --noEmit` passes (strict mode, no `any`)
- [x] No service-role key in `dist/chrome/`
- [ ] Load unpacked in Chrome — extension appears without errors
- [ ] Popup: Sign in with Google → tokens saved → reopened popup shows "Recent jobs"
- [ ] YouTube watch page: "Save transcript" button injected within ~1.5 s
- [ ] Click button → "Saving…" → "Saved ✓" → job appears as Done in dashboard
- [ ] Dashboard submit → auto-trigger via `?yt2text_job=` → job reaches Done without clicking button

### Known issues fixed during validation

- `scripting` permission was missing from manifest → `browser.scripting` was `undefined`. Added to `manifests/chrome.json`.
- `window.opener` unreachable when using `browser.tabs.create` → switched to `window.open()` in popup.
- Callback page used server-side Supabase client → couldn't read cross-project session. Fixed to read tokens from URL hash directly.
- `NEXT_PUBLIC_SITE_URL=https://yt-reader.com` in `web/.env.local` caused server-side auth redirects to production. Must be set to `http://localhost:3000` for local dev.
- `supabase/config.toml` `additional_redirect_urls` was missing `/auth/extension-callback`. Added.

## 6.3 — Firefox + edge cases ⏳ Not started

## 6.4 — Production polish ⏳ Not started
