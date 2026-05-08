# Status: Browser Extension Fetcher

## 6.1 — Backend foundation ✅ Done

All items merged and validated on `replan/browser-extension`.

- DB migrations: `awaiting_browser_fetch` status, `fetch_payload_path` column, updated `grab_pending_transcript` RPC, `recover_browser_stale_jobs` RPC, `fetch-payloads` bucket.
- `POST /api/extension/submit-fetch` — auth, ownership check, storage upload, status transition.
- `GET /api/extension/jobs/by-video` — returns pending jobs for a video.
- `GET /api/extension/jobs/recent` — returns last 5 jobs (popup).
- Worker: `load_fetched_payload`, payload-skip branch in `_run_en_pipeline`, `recover_browser_stale_jobs` call in main loop.
- Dashboard: `awaiting_browser_fetch` badge, `youtubeDeepLink` in submit response, `window.open` on success.

## 6.2 — Chrome extension 🔄 In progress — caption fetch not yet working

Implementation complete on `replan/browser-extension`. Several bugs found and fixed during validation; caption fetching is still failing (see Known Issues below).

### What was built

| File | Purpose |
| --- | --- |
| `extension/manifests/chrome.json` | MV3 manifest — `service_worker`, content script on `youtube.com/watch*`, permissions: `storage`, `identity`, `activeTab`, `scripting` |
| `extension/src/lib/auth.ts` | JWT storage, auto-refresh, OAuth URL builder |
| `extension/src/lib/api.ts` | `submitFetch`, `getJobsByVideo` with bearer auth |
| `extension/src/lib/youtube/timedtext.ts` | Reads `ytInitialPlayerResponse`, picks best caption track, fetches VTT, parses to `RawSegment[]` |
| `extension/src/background/index.ts` | `FETCH_AND_SUBMIT` handler; uses `scripting.executeScript` with `world: "MAIN"` to run fetch inside the YouTube tab |
| `extension/src/content/youtube.tsx` | Injects "Save transcript" button via Preact; auto-triggers on `?yt2text_job=` |
| `extension/src/popup/main.tsx` | Login/logout, recent jobs list |
| `web/app/auth/extension-callback/page.tsx` | Reads tokens from URL hash, `postMessage` to popup opener |

### Bugs fixed during validation (2026-05-08)

| Bug | Root cause | Fix |
| --- | --- | --- |
| Popup showed no recent jobs | `host_permissions` missing `http://localhost:3000/*` — Chrome silently blocked all fetch calls to local server | Added localhost and Supabase local URL to `manifests/chrome.json` |
| "Extension context invalidated" on button click | Extension was rebuilt while YouTube tab was open; content script lost its runtime context | Catch this specific error in `content/youtube.tsx`, show "Extension was reloaded — please refresh the page" |
| "Caption fetch failed" (no detail) | `tabs.query({ currentWindow: true })` returns empty in MV3 service worker (no window context); `result.error` silently dropped by Chrome | Use `sender.tab.id` from message listener; refactored `fetchCaptionsInTab` to never throw — returns `{ ok, error }` instead |
| "ytInitialPlayerResponse not found" | `scripting.executeScript` defaults to isolated world; `ytInitialPlayerResponse` lives on `window` in the main world | Added `world: "MAIN"` to `executeScript` call |
| "Unexpected end of JSON input" | `baseUrl` from `ytInitialPlayerResponse` already contains `fmt=vtt3`; appending `&fmt=json3` created a duplicate parameter — YouTube returned empty body | Switched to VTT format; use `URL.searchParams.set("fmt", "vtt")` to replace, not append |

### ⚠️ Current blocker

Caption fetching is still not confirmed working end-to-end. The VTT fix was applied last and has not yet been validated in Chrome. Next step: reload extension, open [test video](https://www.youtube.com/watch?v=kZ-zzHVUrO4), click "Save transcript", verify job reaches Done in dashboard.

### Validation checklist (6.2)

- [x] `npm run build:chrome` passes clean
- [x] `tsc --noEmit` passes (strict mode, no `any`)
- [x] No service-role key in `dist/chrome/`
- [x] Load unpacked in Chrome — extension appears without errors
- [x] Popup: Sign in with Google → tokens saved → reopened popup shows "Recent jobs"
- [ ] YouTube watch page: "Save transcript" button injected within ~1.5 s
- [ ] Click button → "Saving…" → "Saved ✓" → job appears as Done in dashboard
- [ ] Dashboard submit → auto-trigger via `?yt2text_job=` → job reaches Done without clicking button

## 6.3 — Firefox + edge cases ⏳ Not started

## 6.4 — Production polish ⏳ Not started
