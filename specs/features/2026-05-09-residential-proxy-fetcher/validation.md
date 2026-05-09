# Validation: Residential Proxy Fetcher

## Libraries & Tools

- Manual curl against Bright Data API to verify credentials before wiring into code
- Worker logs — confirm proxy URL appears in yt-dlp debug output (masked)
- Supabase dashboard — job transitions `pending → done` with proxy active

## Scorecard

- [ ] `RESIDENTIAL_PROXY_URL` absent → worker fetches transcript exactly as before (no regression)
- [ ] `RESIDENTIAL_PROXY_URL` set → yt-dlp routes through residential proxy (confirm via yt-dlp verbose log showing proxy)
- [ ] `RESIDENTIAL_PROXY_URL` set → subtitle HTTP download uses proxy (confirm via requests debug or Bright Data dashboard traffic)
- [ ] Subtitle download fails → Web Unlocker fallback fires and returns subtitle content
- [ ] `BRIGHT_DATA_WEB_UNLOCKER_TOKEN` absent → fallback silently skipped, original error raised
- [ ] Bright Data zones have VPS IP in Authorized IPs whitelist
- [ ] Credentials rejected when called from a non-whitelisted IP (local machine test)
- [ ] Full end-to-end: submit a YouTube URL on production server → job reaches `done`, `.md` file appears in Storage

## Smoke Tests

```bash
# 0. Get VPS public IP (run on server via SSH)
curl https://ifconfig.me

# 1. Verify residential proxy credentials work (run on server — should succeed)
curl -i --proxy brd.superproxy.io:33335 --proxy-user USERNAME:PASSWORD -k "https://geo.brdtest.com/welcome.txt?product=resi&method=native"
# Run same command locally — should be rejected if IP whitelist is set

# 2. Verify Web Unlocker API credentials work
curl https://api.brightdata.com/request \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"zone":"web_unlocker1","url":"https://www.youtube.com","format":"raw"}'

# 3. Run worker locally with proxy env vars set, submit a job, watch logs
RESIDENTIAL_PROXY_URL=http://user:pass@brd.superproxy.io:22225 python -m src.main

# 4. Check job status in DB
# transcripts row should reach status=done
```
