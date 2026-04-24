Run the full test suite before building or shipping a feature.

Spawn a subagent using the Agent tool with the following prompt (do NOT run the tests yourself — delegate entirely to the subagent to keep the current context clean):

---
Run the project test suite in c:\Projects\youtube-to-text and report only the final result.

Steps:
1. Run `cd web && npm run test` (vitest unit tests).
   - If tests fail, report which tests failed and their errors, then stop.
2. Run `cd web && npm run test:build` (smoke test against production build).
   - If it fails, report the error and stop.
3. If both pass, return a short summary: number of unit tests passed + "build smoke test passed".

Return only the final summary or failure report. No intermediate output.
---

After the subagent completes, show its result to the user.
