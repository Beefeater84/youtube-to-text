# Plan: Browser Extension Fetcher

The feature is split into four sub-phases. Each MUST be merged on its own feature branch and validated independently.

## 6.1 — Backend foundation (no extension required)

Goal: server, DB, and worker support a "pre-fetched payload" job path. Can be tested end-to-end with `curl`.

### Database migrations (under `supabase/migrations/`)

1. `<ts>_extend_transcript_status_awaiting_browser_fetch.sql`
   - Drop and re-create the CHECK constraint on `transcripts.status` to include `awaiting_browser_fetch`.

2. `<ts>_add_fetch_payload_path_column.sql`
   - `ALTER TABLE transcripts ADD COLUMN fetch_payload_path TEXT NULL;`
   - No backfill needed.

3. `<ts>_update_grab_pending_transcript.sql`
   - Replace `grab_pending_transcript()` so the row selector becomes:
     `WHERE status = 'pending' OR (status = 'queued' AND fetch_payload_path IS NOT NULL)`
   - Returned columns include `fetch_payload_path`.

4. `<ts>_recover_browser_stale_jobs.sql`
   - New RPC `recover_browser_stale_jobs(timeout_minutes int)` that flips rows where `status='awaiting_browser_fetch' AND now() - updated_at > make_interval(mins => timeout_minutes)` to `status='pending'`.

5. `<ts>_create_fetch_payloads_bucket.sql`
   - `INSERT INTO storage.buckets (id, name, public) VALUES ('fetch-payloads', 'fetch-payloads', false);`
   - RLS: only service role reads/writes.

### Web: API route

`web/app/api/extension/submit-fetch/route.ts`
- Method: POST
- Body schema (zod): `{job_id?: uuid, video_id: string, target_language: string, source_language: string, metadata: VideoMetadata, segments: RawSegment[]}`
- Auth: `createClient()` from `web/libs/supabase/server.ts` (reads cookies → user JWT). Reject if no session.
- If `job_id` provided: verify `transcripts.user_id === user.id` and `status === 'awaiting_browser_fetch'`. Else: insert new row with `status='awaiting_browser_fetch'` for this user.
- Upload payload JSON via `createAdminClient()` (service role) to `fetch-payloads/{video_id}/{target_language}.json`.
- Update row: `status='queued'`, `fetch_payload_path='<path>'`.
- Return `{job_id, status: 'queued'}`.

### Web: dashboard form changes

- `web/features/create-transcript/api/submit-job.ts`: change default insert status to `awaiting_browser_fetch`. Include `youtubeDeepLink: \`https://www.youtube.com/watch?v=${video_id}&yt2text_job=${row.id}\`` in the response per inserted row.
- `web/features/create-transcript/ui/CreateTranscriptForm.tsx`: on success, `window.open(youtubeDeepLink, '_blank')` for the EN row (the primary one); display a notice about the extension.
- `web/widgets/dashboard/ui/StatusBadge.tsx`: add badge variant for `awaiting_browser_fetch` ("Waiting for extension").

### Worker: payload-aware pipeline

- `worker/src/models.py` — add `fetch_payload_path: Optional[str] = None` to `TranscriptJob` dataclass.
- `worker/src/db.py:grab_next_job` — propagate `fetch_payload_path` from the RPC row.
- `worker/src/pipeline/load_fetched_payload.py` — new module: `load_fetched_payload(path: str) -> FetchResult`. Uses Supabase admin client (service role) via `storage.from_('fetch-payloads').download(path)`, then `json.loads`, then constructs `FetchResult`.
- `worker/src/pipeline/run.py:_run_en_pipeline` — at the top:
  ```python
  if job.fetch_payload_path:
      logger.info("step 1/5: loading pre-fetched payload (browser extension) for %s", job.youtube_video_id)
      result = load_fetched_payload(job.fetch_payload_path)
  else:
      logger.info("step 1/5: fetching transcript via yt-dlp for %s", job.youtube_video_id)
      result = fetch_transcript(job.youtube_video_id, target_lang="en")
  ```
- `worker/src/main.py` — call `db.recover_browser_stale_jobs(EXTENSION_TIMEOUT_MINUTES)` once per poll iteration alongside the existing `recover_stale_jobs`.

## 6.2 — Extension MVP (Chrome only)

Goal: a working Chrome extension that adds a button on YouTube and submits to the server.

### Repo structure

```
extension/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── manifests/
│   └── chrome.json
├── src/
│   ├── background/index.ts
│   ├── content/youtube.tsx
│   ├── popup/index.html
│   ├── popup/main.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── youtube/timedtext.ts
│   │   └── storage.ts
│   └── shared/types.ts
└── README.md
```

### Auth flow

- Popup shows "Sign in with Google" button.
- Clicking calls `chrome.identity.launchWebAuthFlow({url: <Supabase OAuth URL with redirect to https://app.example.com/auth/extension-callback>, interactive: true})`.
- New page `web/app/auth/extension-callback/page.tsx` reads the Supabase session, then calls `window.opener.postMessage({access_token, refresh_token}, EXTENSION_ORIGIN)` and closes.
- Popup `auth.ts` listens for the message, stores JWT in `chrome.storage.local`.

### Fetch path

`src/lib/youtube/timedtext.ts`
1. Inspect the YouTube page (via content script) to read `ytInitialPlayerResponse` and pull caption track metadata (`baseUrl`, `languageCode`).
2. Background service worker fetches `${baseUrl}&fmt=json3` (browser cookies are sent automatically because of host permissions).
3. Parse json3 events into `RawSegment[]` (the same shape produced by the worker today — see `worker/src/models.py`).
4. Compose `VideoMetadata` from the page's `ytInitialPlayerResponse.videoDetails`.
5. POST to `/api/extension/submit-fetch`.

### Content script

`src/content/youtube.tsx`
- Inject a "Save transcript" button into the YouTube watch page chrome (rendered via Preact, not React).
- On click → `runtime.sendMessage` to background → background runs the fetch path.
- If URL has `?yt2text_job=<uuid>` → auto-click after the page is ready.
- Show inline status (loading/done/error) below the button.

## 6.3 — Firefox build + edge cases

- `manifests/firefox.json` — uses `background.scripts` instead of `service_worker`. Same content script/permissions.
- `vite.config.ts` produces `dist/firefox/` from the same source.
- Test edge cases:
  - Video with no captions at all → server should mark job `failed` with a clear message.
  - Member-only / age-restricted videos → fail gracefully (extension surfaces YouTube's response to the user).
  - Live streams (no replay) → reject before submit.
  - Multiple caption tracks (auto-generated vs user-uploaded) → prefer user-uploaded, EN preference per existing rules.
- Add error UI in popup ("last fetch failed: <reason>").

## 6.4 — Production polish

- Public `/install-extension` page on the web app linking to Chrome Web Store and Firefox Add-ons.
- README.md in `extension/` with dev install steps (`web-ext run --target chromium`, `web-ext run --target firefox-desktop`).
- Submit packages to Chrome Web Store and Firefox Add-ons review.
- (Backlog, not blocking) Sentry for the extension service worker.

## Critical files to reference

- [worker/src/pipeline/run.py:33-125](../../../worker/src/pipeline/run.py#L33-L125) — pipeline orchestration; insert payload-skip branch here.
- [worker/src/pipeline/fetch_transcript.py:36-73](../../../worker/src/pipeline/fetch_transcript.py#L36-L73) — current cookie handling; do not delete (fallback path keeps it).
- [worker/src/db.py:26-39](../../../worker/src/db.py#L26-L39) — `grab_next_job`, must surface `fetch_payload_path`.
- [worker/src/models.py:49-66](../../../worker/src/models.py#L49-L66) — `FetchResult`/`VideoMetadata`/`RawSegment` shapes that the extension payload must match.
- [web/features/create-transcript/api/submit-job.ts](../../../web/features/create-transcript/api/submit-job.ts) — change default status, add deep-link.
- [web/widgets/dashboard/ui/StatusBadge.tsx](../../../web/widgets/dashboard/ui/StatusBadge.tsx) — add new badge.
- [web/libs/supabase/server.ts](../../../web/libs/supabase/server.ts), [web/libs/supabase/admin.ts](../../../web/libs/supabase/admin.ts) — clients for the new API route.

## Reuse opportunities

- `slugify`, `find_or_create_channel`, all enrich/LLM/markdown/storage helpers stay unchanged — they are downstream of the swap point.
- Existing recovery RPC pattern (`recover_stale_jobs`) is the template for `recover_browser_stale_jobs`.
- `StatusBadge` already has multiple variants; just add another case.
