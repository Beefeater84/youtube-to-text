# Plan: #33 CLI воркера: создать транскрипт без фронтенда

Issue: #33 · Approach: https://github.com/Beefeater84/youtube-to-text/issues/33#issuecomment-6443797423
Delivery: -
Later: -

## Group 1: CLI, job submission and inline run

- Task: #33
- Goal: `python -m src.cli <url|id>` submits a job like the web action, waits for the worker or runs the pipeline inline (EN and non-EN), downloads the Markdown and exits with 0/1/2.
- Files: `worker/src/cli.py` (create), `worker/src/db.py` (change: submit-jobs helper mirroring submit-job.ts, `claim_job(id)`, row read by id), `worker/tests/test_cli.py` (create), `worker/tests/conftest.py` (change if a shared Supabase mock fixture is needed)
- Reuse: `db.create_pending_job`, `find_done_transcript`, `mark_job_done`, `mark_job_failed`, `download_markdown_from_storage`; `pipeline.run.run_pipeline`; `models.TranscriptJob`, `DependencyPending`; `main.py` structure
- Done when: unit tests for URL parsing, submit/reuse/requeue logic, done-shortcut, wait-mode status transitions and timeout, inline EN and inline non-EN, failed → exit 1 with error text pass with mocked Supabase and pipeline.
- Complexity: complex

## Group 2: Stale test and docs

- Task: #33
- Goal: The whole worker test suite is green and the CLI is documented.
- Files: `worker/tests/test_uc3_create_en_dependency.py` (change: patch `defer_for_dependency`/current API), `worker/tests/test_uc2_translate_from_en.py`, `worker/tests/test_uc4_no_en_subs.py` (change: mock the OpenAI calls they make for real), `worker/agent.md` (change: CLI section), `readme.md` (change: one line linking to it)
- Reuse: -
- Done when: `cd worker && .venv/bin/pytest` passes fully; docs show the commands for wait mode, `--inline`, `--out`, exit codes and required `worker/.env` vars.
- Complexity: normal
