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

Ошибка: `Tunnel connection failed: 403 Forbidden` при подключении к youtube.com через зону `yt_reader`.

**Диагностика (2026-05-10):**

- `curl` с port 33335 → 200 OK (credentials верные, IP не заблокирован)
- `requests` с port 22225 + `verify=False` → geo.brdtest.com: 200 OK, youtube.com: 403
- Вывод: youtube.com блокируется на уровне зоны `yt_reader`, не на уровне IP или SSL

**Вероятные причины:**

- Зона `yt_reader` требует установки Bright Data SSL-сертификата для HTTPS-инспекции
- Зона не настроена под YouTube (нет target site / premium domain)
- Bright Data блокирует YouTube по умолчанию для residential зон без спец. конфигурации

**Установлено (2026-05-10):**

- YouTube относится к restricted domains в Bright Data — доступ закрыт до верификации аккаунта
- SSL-сертификат скачан: `worker/brightdata_proxy_ca/` (добавлен в `.gitignore`)
- Порт для сертификата: **33335** (указано в названии файла)

### Следующий шаг — пройти KYC верификацию в Bright Data

**Ссылка:** [brightdata.com/cp/kyc](https://brightdata.com/cp/kyc)

После верификации YouTube должен стать доступен через зону `yt_reader`. Затем:

1. Проверить curl с `--cacert` к `youtube.com`
2. Зарегистрировать сертификат системно (локально и на VPS)
3. Сменить порт в `RESIDENTIAL_PROXY_URL` с 22225 на 33335
4. Запустить воркер и убедиться что 403 ушёл

### Group 5 (условная): Bright Data SSL-сертификат для деплоя

**Выполнять только если** установка сертификата решает 403 для YouTube.

**Локально:** установить в системный cert store или задать env var:

```bash
REQUESTS_CA_BUNDLE=/path/to/brightdata.crt
SSL_CERT_FILE=/path/to/brightdata.crt
```

**На VPS (деплой):**

1. Сохранить `brightdata.crt` в репозиторий: `worker/certs/brightdata.crt`
2. Добавить в `.env` на VPS:

   ```text
   REQUESTS_CA_BUNDLE=/path/to/worker/certs/brightdata.crt
   SSL_CERT_FILE=/path/to/worker/certs/brightdata.crt
   ```

3. Перезапустить воркер

Альтернатива (системный cert store на VPS, один раз):

```bash
sudo cp brightdata.crt /usr/local/share/ca-certificates/brightdata.crt
sudo update-ca-certificates
```

Примечание: `requests` и Python `ssl` подхватывают `REQUESTS_CA_BUNDLE` / `SSL_CERT_FILE` автоматически — yt-dlp тоже, так как использует Python ssl. Менять код не нужно.

---

## Key Decisions

- `RESIDENTIAL_PROXY_URL` absent → all proxy code skipped, worker unchanged for local dev
- Reuse existing `BRIGHT_DATA_API` env var name to avoid renaming what's already in `.env`
- `requests` preferred over `urllib` — native proxy dict, timeout param, raise_for_status
- Web Unlocker fires only on non-200 response, not on every request — avoids extra latency
- No proxy on yt-dlp metadata if `RESIDENTIAL_PROXY_URL` is unset — zero regression risk
