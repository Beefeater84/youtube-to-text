# Requirements: Production Build Smoke Tests

## Functional Requirements

- `npm run test:build` MUST run `npm run build` first; if build fails, script exits immediately with code 1
- After successful build, script MUST start `npm run start` and wait until the server responds (max 30s timeout)
- Script MUST fetch `/sitemap.xml` and test every URL listed in `<loc>` tags
- Script MUST also test `/login` (not in sitemap)
- For each URL, script MUST assert:
  - HTTP status is 200
  - Response body does NOT contain `DYNAMIC_SERVER_USAGE`
  - Response body does NOT contain `Internal Server Error`
  - Response body does NOT contain `Application error`
- Script MUST print a clear pass/fail line per URL
- Script MUST kill the background server process on exit (success or failure)
- Script MUST exit with code 1 if any check failed, code 0 if all passed
- Script MUST work on Node 18+ with no npm install required

## Modules & Packages

- No new packages — Node.js built-ins only:
  - `child_process` (spawn, execSync)
  - `fetch` (Node 18+ built-in)
  - No XML parser — regex extraction of `<loc>...</loc>` is sufficient

## Constraints

- Script is ESM (`.mjs`) — use `import` not `require`
- Base URL defaults to `http://localhost:3000`; override via `BASE_URL` env var
- Script must not leave orphaned node processes on failure — use `process.on('exit')` cleanup
- Do not add the script to CI yet — local-only for now
