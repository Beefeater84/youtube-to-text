# Requirements: Browser Extension Fetcher

## Background

YouTube blocks server IPs and invalidates dedicated-account cookies, making the existing yt-dlp-on-VPS path unreliable. A browser extension running in the user's own browser fetches the captions through the user's authenticated YouTube session, bypasses anti-bot blocks, and forwards the payload to the server which then runs the LLM/storage pipeline.

## Functional Requirements

### Trigger and submission flow
- Dashboard form MUST insert new transcript jobs with `status='awaiting_browser_fetch'` (not `pending`).
- Submit-job server action MUST return a `youtubeDeepLink` containing the job id as `?yt2text_job=<uuid>`.
- Dashboard form MUST open this URL in a new tab on success.
- A user MUST also be able to start a fetch by clicking a "Save transcript" button injected by the extension on any YouTube watch page (without first using the dashboard).

### Browser extension
- Extension MUST be built as a single TypeScript codebase producing two artifacts: Chrome (MV3 with `service_worker`) and Firefox (MV3 with `background.scripts`).
- Extension MUST authenticate the user via Supabase Google OAuth in a popup; the resulting JWT MUST be stored in `chrome.storage.local`.
- Content script MUST run on `https://www.youtube.com/watch*` pages.
- Content script MUST read `?yt2text_job=<uuid>` from the URL and auto-trigger the fetch when present.
- Background service worker MUST fetch captions from `https://www.youtube.com/api/timedtext` (VTT format) using the browser's YouTube cookies (no extra auth from the extension to YouTube). The caption URL is taken from `ytInitialPlayerResponse.captions`; `fmt` is overridden to `vtt` via `URL.searchParams.set` to avoid duplicate parameters already present in the base URL.
- Background MUST POST `{job_id?, video_id, target_language, source_language, metadata, segments[]}` to `/api/extension/submit-fetch` with the user's Supabase JWT in `Authorization: Bearer …`.
- Extension popup MUST display the latest few jobs and a Login/Logout button. No transcript content is rendered in the popup.

### Server endpoints (Next.js)
- `POST /api/extension/submit-fetch`
  - MUST validate the Supabase JWT and resolve `user.id`.
  - If `job_id` is provided, the job MUST belong to `user.id`; otherwise reject with 403.
  - If `job_id` is omitted, server MUST create a new `transcripts` row with `user_id=user.id`.
  - MUST upload the `{metadata, segments, source_language}` JSON payload to Storage at `fetch-payloads/{video_id}/{language}.json`.
  - MUST update the row with `status='queued'` and `fetch_payload_path='<storage path>'`.
  - MUST return `{job_id, status: 'queued'}` on success.
- `GET /api/extension/jobs/by-video?video_id=<id>`
  - MUST return the current user's pending/awaiting jobs for the given video (used by the content script to show button state).
- `GET /auth/extension-callback`
  - MUST receive Supabase OAuth redirect, extract the session, and `postMessage` it to `window.opener`. The page is consumed only by the extension popup.

### Worker (Python)
- `grab_pending_transcript` RPC MUST also pick up rows in status `queued` whose `fetch_payload_path` is set; it MUST NOT pick `awaiting_browser_fetch` rows.
- Pipeline MUST skip `fetch_transcript` when `fetch_payload_path` is set; instead it MUST download the payload JSON from Storage and reconstruct a `FetchResult`.
- Pipeline behaviour for `pending` rows is unchanged (legacy yt-dlp path).
- A new RPC `recover_browser_stale_jobs(timeout_minutes)` MUST flip rows in `awaiting_browser_fetch` older than `timeout_minutes` back to `pending`. The worker main loop MUST call it once per poll iteration.

### Database
- `transcripts.status` CHECK constraint MUST include `awaiting_browser_fetch`.
- `transcripts` MUST have a new column `fetch_payload_path TEXT NULL`.
- Storage bucket `fetch-payloads` MUST be created (private; only service role reads).
- RLS on `transcripts` MUST allow extension users to update only their own rows when transitioning from `awaiting_browser_fetch` → `queued` via the API endpoint (the endpoint uses the user JWT, not the service-role key, so RLS applies).

### Fallback behaviour
- A job in `awaiting_browser_fetch` longer than `EXTENSION_TIMEOUT_MINUTES` (default 30) MUST be reset to `pending` so the legacy yt-dlp worker picks it up. Users without the extension installed must still get a transcript eventually.

## Modules & Packages

### Browser extension
- `vite` + `@crxjs/vite-plugin` (or equivalent) — MV3 bundler.
- `webextension-polyfill` — cross-browser API.
- `zod` — runtime validation of API payloads.
- `@supabase/supabase-js` — JWT exchange + auth helper.
- No React in the extension popup (use Preact or vanilla TSX) — keep bundle small.

### Web (already installed)
- `@supabase/ssr`, `@supabase/supabase-js` — for new API routes.

### Worker (new)
- `requests` (or `httpx`) — to GET payload JSON from Storage public/signed URL.
- No new third-party packages otherwise.

## Constraints

- Extension MUST NOT embed any service-role Supabase key. Only user JWTs flow through it.
- Extension MUST NOT cache transcript text locally beyond the in-flight POST.
- Server MUST NOT accept payloads larger than a hard limit (e.g. 5 MB JSON) to prevent abuse.
- Schema of payload JSON in Storage MUST match the existing `FetchResult` shape so the worker can deserialize without code branches.
- Extension auth flow MUST work in incognito only if the user explicitly enables the extension in incognito (standard MV3 behaviour, document in README).
- TypeScript strict mode in the extension codebase. No `any`.
- No new env vars in the worker. New env var on the web side: `EXTENSION_TIMEOUT_MINUTES` (default 30).
