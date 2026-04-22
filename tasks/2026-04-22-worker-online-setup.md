# Task: Fix Worker Online (Runtime & Cookies)

## Status
- [x] Install JS Runtime in Worker Dockerfile
- [ ] Update YouTube Cookies
- [ ] Verify Production Pipeline

## Log Context
The following logs were captured from the online worker:
```text
[youtube] Extracting URL: https://www.youtube.com/watch?v=RRKwmeyIc24 
[youtube] RRKwmeyIc24: Downloading webpage 
WARNING: [youtube] The provided YouTube account cookies are no longer valid. They have likely been rotated in the browser as a security measure. For tips on how to effectively export YouTube cookies, refer to  https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies .
WARNING: [youtube] No supported JavaScript runtime could be found. Only deno is enabled by default; to use another runtime add  --js-runtimes RUNTIME[:PATH]  to your command/config. YouTube extraction without a JS runtime has been deprecated, and some formats may be missing. See  https://github.com/yt-dlp/yt-dlp/wiki/EJS  for details on installing one
[youtube] RRKwmeyIc24: Downloading android vr player API JSON 
WARNING: [youtube] The provided YouTube account cookies are no longer valid. They have likely been rotated in the browser as a security measure. For tips on how to effectively export YouTube cookies, refer to  https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies .
[worker] 16:49:15 INFO subtitle language: en (requested)
[worker] 16:49:15 INFO downloading en subtitles (json3) directly
[worker] 16:49:15 INFO step 2/5: enriching DB record with metadata
[worker] 16:49:15 INFO HTTP Request: GET https://btklcnjrawuhtgcqvdmp.supabase.co/rest/v1/channels?select=id&youtube_id=eq.UCKWaEZ-_VweaEx1j62do_vQ "HTTP/2 200 OK"
```

## Goals
1. **Fix Runtime**: `yt-dlp` requires a JavaScript runtime (like Deno, Node.js, or Bun) for reliable YouTube extraction.
2. **Fix Cookies**: The current cookies are invalid/rotated.
3. **Stabilize Worker**: Ensure the worker runs reliably in the online environment.
