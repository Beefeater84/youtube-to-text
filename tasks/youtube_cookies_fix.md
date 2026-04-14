# Task: Fix YouTube Authentication (Cookies)

## Problem
In production, YouTube triggers bot detection for the VPS IP, resulting in the error:  
`ERROR: [youtube] vnlWt1OGT-M: Sign in to confirm you’re not a bot.`

## Findings
1.  **Trunaction Issue**: Docker Compose was truncating the multi-line `YOUTUBE_COOKIES_CONTENT` environment variable from the `.env` file at the first line (~52 bytes). This rendered the cookies useless inside the container.
2.  **Stale Cookies**: Local diagnostics confirmed the current cookies in `.env` are marked as **"no longer valid"** (rotated/expired) by YouTube, even if passed correctly.
3.  **Visibility Issue**: `yt-dlp` was running in `quiet` mode, hiding critical warnings about invalid cookies.

## Progress Made
- [x] **Improved Logging**: `worker/src/pipeline/fetch_transcript.py` now logs the source and length of applied cookies and shows `yt-dlp` warnings.
- [x] **Robust Configuration**: Updated `deploy/docker-compose.prod.yml` to use a **File Volume** instead of an environment variable for cookies. This avoids any truncation issues.
- [x] **Diagnostic Tools**: Created `worker/scratch/debug_cookies.py` to test cookies locally or on the server.
- [x] **Code Pushed**: All changes are committed and pushed to GitHub (branch `main`).

## Remaining Steps (To be done on Server)

### 1. Refresh Cookies
You need fresh cookies from your browser:
*   Use a "cookies.txt" extension in Chrome/Edge.
*   Log in to YouTube.
*   Export cookies in **Netscape** format.

### 2. Create Cookie File on Server
On the VPS, create the file that the new Docker config expects:
```bash
# Path: /opt/youtube-to-text/youtube_cookies.txt
nano /opt/youtube-to-text/youtube_cookies.txt
```
Paste the full fresh cookie content there and save.

### 3. Deploy New Image
Since we changed the code and the Docker configuration, you need to pull the new image (after GitHub Actions finishes the build):
```bash
cd /opt/youtube-to-text/deploy
# Must use --env-file because .env is in the parent directory
docker compose --env-file ../.env -f docker-compose.prod.yml pull worker
docker compose --env-file ../.env -f docker-compose.prod.yml up -d worker
```

### 4. Verify
Check the logs to ensure the file is loaded and the size is correct (2000+ bytes):
```bash
docker compose --env-file ../.env -f docker-compose.prod.yml logs --tail 50 worker
```
Look for the line:  
`INFO - YouTube cookies applied from file: /app/youtube_cookies.txt (size: 28XX bytes)`
