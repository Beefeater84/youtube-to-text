# Validation: Browser Extension Fetcher

## 6.1 — Backend foundation

### DB checks
- [ ] `\d transcripts` shows new column `fetch_payload_path`.
- [ ] `INSERT INTO transcripts (..., status='awaiting_browser_fetch') RETURNING id;` succeeds.
- [ ] `INSERT … status='bogus'` fails with constraint violation (proves CHECK was rebuilt).
- [ ] `SELECT bucket_id FROM storage.buckets WHERE id='fetch-payloads';` returns one row.

### Endpoint smoke (no extension)
1. `curl -X POST $WEB/api/extension/submit-fetch -H "Authorization: Bearer $JWT" -H 'Content-Type: application/json' -d @sample-payload.json` → expect `{job_id, status: 'queued'}`.
2. `psql … SELECT status, fetch_payload_path FROM transcripts WHERE id = '<job_id>';` → status=queued, path set.
3. Wait until worker logs `step 1/5: loading pre-fetched payload (browser extension)`.
4. Worker eventually logs `mark_job_done`. Dashboard shows the row as Done with a working `markdown_url`.

### Fallback regression
1. Set `EXTENSION_TIMEOUT_MINUTES=1`.
2. Submit a job through the dashboard; do not engage the extension.
3. Within ~1 minute the row flips to `pending`.
4. Worker picks it up via the legacy yt-dlp path; final state is Done.

### Negative paths
- POST `/api/extension/submit-fetch` with no auth → 401.
- POST with `job_id` belonging to another user → 403.
- POST with payload >5 MB → 413 (or whatever bound is chosen).

## 6.2 — Chrome extension

### Manual scenarios
1. Load unpacked from `dist/chrome/` in `chrome://extensions` (Developer Mode).
2. Click extension icon → popup → Sign in with Google → close popup; reopen → user shown as logged in.
3. Open a YouTube video in a new tab → "Save transcript" button is injected near the player.
4. Click button → background fetches captions → POST to server → ~30s later the job appears as Done in `/dashboard`.
5. From the dashboard, submit a new URL → extension's tab opens YouTube with `?yt2text_job=…` → auto-trigger fires without clicking the button → row reaches Done.

### Automated where reasonable
- Unit tests for `lib/youtube/timedtext.ts` (json3 parser, language preference logic).
- Unit tests for `lib/auth.ts` (JWT storage/refresh).
- A Vite build smoke (`pnpm --filter extension build`) in CI.

## 6.3 — Firefox + edge cases

### Firefox build
- `web-ext run --target firefox-desktop` boots an extension-enabled Firefox; same Save scenario succeeds.
- Verify the Firefox manifest does not silently fall back to MV2.

### Edge-case matrix (run in both browsers)
| Scenario | Expected |
|---|---|
| Public video with EN captions | Done in ~30s |
| Public video, captions only in source lang ≠ EN | Worker-side translation kicks in; final EN markdown produced |
| Video with no captions at all | Job → Failed with message "no captions available" |
| Member-only / age-restricted video | Job → Failed with YouTube's reason surfaced |
| Live stream (active or unfinished) | Extension refuses before POST; user sees inline error |
| Private/unlisted video that user owns | Done if YouTube returns captions through user session; else Failed |

## 6.4 — Production polish

### Distribution
- [ ] `/install-extension` page on the web app shows working links to Chrome Web Store + Firefox Add-ons.
- [ ] README in `extension/` documents dev install + release steps.
- [ ] A clean install on a fresh browser profile (no prior auth) gets a user from "Save transcript" click → Done in under 60 seconds.

## Cross-cutting

- [ ] No service-role Supabase key appears in any compiled extension bundle (grep `dist/`).
- [ ] No transcript text is logged in worker output.
- [ ] Existing tests under `worker/tests/` pass unchanged after the payload-skip branch is added.
- [ ] Existing dashboard for users without the extension still produces transcripts via the legacy path (no regression for current users).
