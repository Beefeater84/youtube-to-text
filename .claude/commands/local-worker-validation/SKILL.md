---
name: local-worker-validation
description: Use when verifying worker functionality (transcripts, metadata, runtime) in a local Docker environment before deployment.
---

# Local Worker Validation

## Overview
This skill provides a standard way to build and run the worker container locally for testing purposes. It ensures that changes (like adding a JS runtime or fixing transcript logic) are validated in an environment identical to production.

## When to Use
- After modifying `worker.Dockerfile`
- After changing transcript extraction logic in `fetch_transcript.py`
- When debugging "Sign in to confirm you're not a bot" errors locally
- Before pushing changes to the `main` branch

## Core Commands

### 1. Build the Image
Always build from the project root to ensure the build context includes both `worker/` and `deploy/` if needed.
```bash
docker build -t worker-test -f deploy/docker/worker.Dockerfile .
```

### 2. Validate JS Runtime
Verify that `yt-dlp` can find a JavaScript engine (Node.js).
```bash
docker run --rm worker-test python -c "import yt_dlp; ydl = yt_dlp.YoutubeDL({'verbose': True}); print('Selected Runtime:', ydl.get_js_interpreter())"
```

### 3. Validate Transcript Extraction
Test with a specific video ID to ensure the pipeline works.
```bash
docker run --rm \
  --env-file .env \
  worker-test python -c "from src.pipeline.fetch_transcript import fetch_transcript; res = fetch_transcript('RRKwmeyIc24'); print(f'Success: {len(res.segments)} segments found')"
```

## Quick Reference Table

| Target | Command Snippet |
|--------|-----------------|
| **Node.js Version** | `docker run --rm worker-test node -v` |
| **Clean Up Images** | `docker rmi worker-test` |
| **Interactive Shell** | `docker run --rm -it worker-test bash` |

## Common Mistakes
- **Wrong Context**: Running `docker build` inside the `worker/` folder. **Fix**: Run from the project root.
- **Missing Env**: Forgetting `--env-file .env` when testing DB connections or using cookies.
- **Stale Image**: Forgetting to re-build after code changes. Always re-run the build command.

## Red Flags
- Testing by running `python src/main.py` directly (this doesn't test the Docker environment).
- Leaving large test images taking up disk space. Use `--rm` for runs and `rmi` after finishing.
