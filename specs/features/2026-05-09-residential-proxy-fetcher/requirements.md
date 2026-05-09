# Requirements: Residential Proxy Fetcher

## Functional Requirements

- All yt-dlp metadata requests route through `RESIDENTIAL_PROXY_URL` when set
- All subtitle file HTTP downloads route through `RESIDENTIAL_PROXY_URL` when set
- If subtitle download fails (non-200 / CAPTCHA), retry once via Bright Data Web Unlocker API
- When none of the proxy env vars are set, worker behaves exactly as before (no regression)
- Proxy credentials never logged

## Modules & Packages

- `requests>=2.32.0` — replaces `urllib.request.urlretrieve` for subtitle download; supports proxy dict natively
- `yt-dlp` — already present; accepts `proxy` key in `ydl_opts` natively
- Bright Data Residential Proxies — external service; format `http://user:pass@brd.superproxy.io:22225`
- Bright Data Web Unlocker — external REST API; endpoint `https://api.brightdata.com/request`

## Constraints

- Do not store proxy credentials anywhere except env vars
- Do not add proxy logic to any path outside `fetch_transcript.py` and `config.py`
- Worker Docker image must remain `python:3.12-slim` — no headless browser dependencies
- Local dev must work without any proxy env vars set
