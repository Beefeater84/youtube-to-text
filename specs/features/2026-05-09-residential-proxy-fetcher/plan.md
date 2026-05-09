# Plan: Residential Proxy Fetcher

**Phase:** 6.5
**Branch:** feature/residential-proxy-fetcher
**Status:** in-progress

## Goal

Route all yt-dlp and subtitle HTTP requests through Bright Data residential proxies so YouTube sees a home-user IP instead of the VPS datacenter IP, eliminating bot-detection and CAPTCHA failures on the server.

## Current State (context for implementation)

### `worker/src/config.py`

Three required vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`) and three optional ones (`POLL_INTERVAL_MS`, `STALE_MINUTES`, `MAX_RETRIES`). No proxy vars yet.

### `worker/src/pipeline/fetch_transcript.py`

- Line 7: imports `urllib.request` (standard library, no proxy support)
- Lines 28–34: `ydl_opts` dict — no `proxy` key
- Lines 37–73: cookie handling via `YOUTUBE_COOKIES_FILE` / `YOUTUBE_COOKIES_CONTENT`
- Line 76: `ydl.extract_info(url, download=False)` — single yt-dlp call
- Line 186: `urllib.request.urlretrieve(chosen["url"], out_path)` — raw HTTP, no proxy, no headers

### `worker/pyproject.toml`

Dependencies: `yt-dlp`, `supabase`, `openai`, `python-dotenv`, `Unidecode`. No `requests` yet.

### `worker/.env`

Already has a commented-out `BRIGHT_DATA_API=50a6c7f1-...` key — this is the Web Unlocker token from an earlier experiment. Reuse it.

---

## Task Groups

### Group 0: VPS IP whitelist in Bright Data (one-time setup, no code)

- SSH на сервер → `curl https://ifconfig.me` → зафиксировать публичный IPv4
- Bright Data dashboard → зона `residential` → **Authorized IPs** → добавить IP сервера
- Bright Data dashboard → зона `web_unlocker1` → **Authorized IPs** → добавить тот же IP
- Проверить: с сервера запрос через credentials проходит; с локальной машины — отклоняется

### Group 1: Add new config vars

**File:** `worker/src/config.py`

Add three optional vars at the bottom (after `MAX_RETRIES`):

```python
RESIDENTIAL_PROXY_URL: str | None = os.environ.get("RESIDENTIAL_PROXY_URL")
BRIGHT_DATA_WEB_UNLOCKER_TOKEN: str | None = os.environ.get("BRIGHT_DATA_API")
BRIGHT_DATA_ZONE: str = os.environ.get("BRIGHT_DATA_ZONE", "web_unlocker1")
```

Note: `BRIGHT_DATA_API` is already the env var name in `.env` — reuse it, no rename needed.

**File:** `worker/pyproject.toml`

Add `"requests"` to `dependencies` list after `"Unidecode"`.

### Group 2: Wire residential proxy into yt-dlp

**File:** `worker/src/pipeline/fetch_transcript.py`

Add import at top of file:

```python
from src import config
```

After `ydl_opts` dict closes (after line 34), before cookie handling, add:

```python
if config.RESIDENTIAL_PROXY_URL:
    ydl_opts["proxy"] = config.RESIDENTIAL_PROXY_URL
    logger.info("yt-dlp routing through residential proxy")
```

### Group 3: Replace urllib with requests for subtitle download

**File:** `worker/src/pipeline/fetch_transcript.py`

Remove line 7: `import urllib.request`

Add: `import requests`

Replace body of `_download_subtitle_from_info` from line 185 onward with:

```python
logger.info("downloading %s subtitles (%s) directly", lang, ext)

proxies = {"http": config.RESIDENTIAL_PROXY_URL, "https": config.RESIDENTIAL_PROXY_URL} \
    if config.RESIDENTIAL_PROXY_URL else None

response = requests.get(chosen["url"], proxies=proxies, timeout=30)

if response.status_code != 200 and config.BRIGHT_DATA_WEB_UNLOCKER_TOKEN:
    logger.warning(
        "subtitle fetch returned %d, retrying via Web Unlocker", response.status_code
    )
    response = requests.post(
        "https://api.brightdata.com/request",
        headers={
            "Authorization": f"Bearer {config.BRIGHT_DATA_WEB_UNLOCKER_TOKEN}",
            "Content-Type": "application/json",
        },
        json={"zone": config.BRIGHT_DATA_ZONE, "url": chosen["url"], "format": "raw"},
        timeout=60,
    )

response.raise_for_status()

with open(out_path, "wb") as f:
    f.write(response.content)
```

### Group 4: Update .env and document new vars

**File:** `worker/.env`

Add below the existing `# BRIGHT_DATA_API=...` line:

```text
# RESIDENTIAL_PROXY_URL=http://USERNAME:PASSWORD@brd.superproxy.io:33335
# BRIGHT_DATA_ZONE=web_unlocker1
```

The `BRIGHT_DATA_API` line is already there — just un-comment it when deploying to prod.

## Current Status (2026-05-09)

### Выполнено

- Groups 1–4 реализованы: `config.py`, `pyproject.toml`, `fetch_transcript.py`, `.env`
- `submit-job.ts` исправлен: EN-джоб теперь создаётся со статусом `pending` (был `awaiting_browser_fetch`)
- `recover_browser_stale_jobs` удалён из воркера и `db.py`
- Миграция `20260509120000` реверт `grab_pending_transcript` к pre-extension логике

### Следующий шаг — ошибка прокси

Ошибка: `Tunnel connection failed: 403 Forbidden` при локальном запуске с `RESIDENTIAL_PROXY_URL`.

**Причина:** Group 0 не выполнена — IP локальной машины не добавлен в whitelist зоны `yt_reader` в Bright Data.

**Что делать в следующем контексте:**

1. SSH на сервер → `curl https://ifconfig.me` → получить IP
2. Bright Data dashboard → зона `yt_reader` → Authorized IPs → добавить IP сервера
3. Либо: добавить локальный IP для тестирования, либо тестировать только с сервера
4. После whitelist — запустить воркер снова и проверить что прокси проходит

---

## Key Decisions

- `RESIDENTIAL_PROXY_URL` absent → all proxy code skipped, worker unchanged for local dev
- Reuse existing `BRIGHT_DATA_API` env var name to avoid renaming what's already in `.env`
- `requests` preferred over `urllib` — native proxy dict, timeout param, raise_for_status
- Web Unlocker fires only on non-200 response, not on every request — avoids extra latency
- No proxy on yt-dlp metadata if `RESIDENTIAL_PROXY_URL` is unset — zero regression risk
