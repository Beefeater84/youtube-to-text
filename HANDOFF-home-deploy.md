# Handoff: переезд yt-reader с VDS на «Vercel + домашний сервер»

Файл передаёт контекст из предыдущей сессии (она шла в соседнем репо learning-finish).
Это рабочая заметка, коммитить её не нужно. Когда план будет перенесён в ранбук и PR, файл можно удалить.

## Цель

- Раньше: всё жило на VDS (Coddy) через `deploy/docker-compose.prod.yml` (Caddy + web + worker),
  Supabase был облачный. VDS отключён: YouTube блокировал запросы с IP датацентра, платить не хотелось.
- Теперь:
  - **web/** (Next.js) деплоится на **Vercel**, бесплатный тариф, домен `yt-reader.com`.
  - **worker/** (Python) и **Supabase** работают **локально на этой машине** (WSL2, хост `home-dev`) и запущены всегда.
  - Пользователь из любого места заходит на фронт и отправляет видео на перевод.

## Что выяснено о машине

- WSL2, systemd включён (`/etc/wsl.conf`: `[boot] systemd=true`), пользователь `tony`.
- Docker есть. Уже запущены два локальных Supabase-стека:
  - `family-shopping-list` занимает **54321–54327** (стандартные порты из `supabase/config.toml` этого репо, поэтому будет конфликт);
  - `learn-finish` занимает **55000–55003**.
- Supabase CLI глобально **не установлен**. Он есть только в `~/home-agent/learning-finish/node_modules/.bin/supabase`, можно использовать `npx supabase`.
- Tailscale установлен и залогинен, нода `home-dev` (`100.80.93.125`). Funnel пока не настроен (`No serve config`).
- `yt-reader.com` сейчас резолвится в `178.104.134.102`, это старый VDS. Где управляется DNS, пока неизвестно.

## Что выяснено о коде

- web читает `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (`web/libs/supabase/admin.ts`).
- Браузер и сервер Vercel ходят в Supabase напрямую: REST, Auth (Google OAuth) и Storage (публичный бакет `transcripts` с `.md`).
- worker (`worker/src/config.py`, `fetch_transcript.py`) читает `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, а также необязательные `YOUTUBE_COOKIES_FILE` / `YOUTUBE_COOKIES_CONTENT`, `POLL_INTERVAL_MS`, `STALE_MINUTES`, `MAX_RETRIES`. Наружу worker открывать не нужно: он только опрашивает Supabase.
- `.github/workflows/deploy.yml` деплоит на VDS при push в `main`. Его нужно отключить.
- `supabase/config.toml`: `project_id = "youtube-to-text"`, `site_url = http://127.0.0.1:3000`, Google-провайдер берёт секрет из `env(GOOGLE_CLIENT_SECRET)`.

## Согласованные решения

1. **Локальный Supabase** для этого репо поднимается на **свободных портах** (например, 5610x вместо 5432x). Применяются миграции из `supabase/migrations`.
2. **Безопасность, обязательно.** У CLI-стека по умолчанию общеизвестный демо-JWT-секрет. Перед тем как открывать API наружу, нужно сгенерировать **свои** JWT secret, anon и service_role ключи. Наружу открывается **только API (Kong)**. Studio, Postgres и Inbucket наружу не открываются.
3. **Туннель: Tailscale Funnel** на API Supabase. Получится HTTPS-адрес `https://home-dev.<tailnet>.ts.net`, это и будет `NEXT_PUBLIC_SUPABASE_URL`. Альтернатива, Cloudflare Tunnel на `api.yt-reader.com`, отложена: для неё DNS нужно переносить в Cloudflare.
4. **Worker** запускается в Docker с `restart: unless-stopped` через отдельный compose для домашнего хоста (без Caddy и web).
5. **Vercel**: проект с Root Directory = `web/`, env-переменные из списка выше, `NEXT_PUBLIC_SITE_URL=https://yt-reader.com`. Домен `yt-reader.com` перевести на Vercel.
6. **Google OAuth**: в Google Console добавить redirect URI `https://<адрес-туннеля>/auth/v1/callback`. В Supabase Auth прописать `site_url = https://yt-reader.com` и redirect `https://yt-reader.com/auth/callback`.
7. **Постоянная работа**: systemd-юниты в WSL для Supabase, worker и funnel. На Windows-хосте нужен автозапуск WSL при входе и отключённый сон. Это даётся пользователю инструкцией.
8. **Изменения в репо** (отдельная ветка `claude/<кратко-о-задаче>`, PR через `gh pr create`): отключить VDS-workflow, добавить домашний compose для worker и ранбук `deploy/README.md` (или новый файл) под новую схему. Код web, по первому взгляду, менять почти не нужно.

Шаги, которые делает только пользователь: логин в Vercel (или токен для `vercel` CLI), DNS у регистратора, Google Console, ключи OpenAI и Google OAuth.

## Открытые вопросы (задать пользователю в начале)

1. Где управляется DNS `yt-reader.com` (регистратор)? Funnel согласован, но DNS всё равно понадобится для перевода домена на Vercel.
2. Данные: переносить ли транскрипты и пользователей со старого облачного Supabase (он ещё жив?) или начать с чистой базы?
3. Windows-хост работает 24/7 или иногда выключается?
4. Секреты: есть ли ключ OpenAI и Google OAuth client id/secret, сохранился ли старый `.env` с VDS?

## Правила работы

- Не править код до подтверждения пользователя. Сначала план, потом изменения.
- Работать в ветке `claude/...`, не в `main`. Перед PR прогнать lint, typecheck и тесты (`web`: npm-скрипты, `worker`: pytest).
- Не трогать продовые ключи и базы без явного подтверждения.

## С чего начать новую сессию

1. Прочитать этот файл, `readme.md`, `specs/tech-stack.md`, `deploy/README.md`.
2. Задать открытые вопросы.
3. Затем по порядку: локальный Supabase на новых портах со своими ключами → worker в Docker → Tailscale Funnel → Vercel и DNS → Google OAuth → автозапуск → PR с изменениями в репо.
