# Context: #33 CLI воркера: создать транскрипт без фронтенда

## Code map

- `web/features/create-transcript/ui/CreateTranscriptForm.tsx` — `extractVideoId(input)` (lines ~27-42): regexes in order `youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})`, `youtu\.be\/(...)`, `youtube\.com\/embed\/(...)`, `youtube\.com\/shorts\/(...)`, then bare `^[a-zA-Z0-9_-]{11}$`, else null; input trimmed. EN added: `languages.includes("en") ? languages : ["en", ...languages]`.
- `web/features/create-transcript/api/submit-job.ts` — `submitTranscriptJob(videoId, languages)`: `ACTIVE_STATUSES = ["done","processing","queued","waiting_dependency"]`; select `id, language, status` by `youtube_video_id` and `language in`; rows not active (`failed`, `pending`) → update `status:'pending'`; missing languages → insert `{youtube_video_id, title: videoId, slug: lang==='en' ? videoId : `${videoId}-${lang}`, status:'pending', language, user_id}`. Non-EN inserted as `pending` (worker parks them itself).
- `worker/src/main.py` — `main()`: `load_dotenv()` before `from src import config  # noqa: E402`; startup `recover_stale_jobs()`, `ensure_storage_bucket()`; loop `grab_next_job()` → `run_pipeline(job)` → `mark_job_done(job.id, result.markdown_url, result.duration_seconds, video_id=job.youtube_video_id)`; `except DependencyPending` logs only; `except Exception as e` → `mark_job_failed(job.id, str(e) or "Unknown pipeline error")`. Logging `[worker] %(asctime)s %(levelname)s %(message)s`.
- `worker/src/db.py` — `get_supabase()` singleton (service role); `grab_next_job()` RPC `grab_pending_transcript` (no args, next pending, EN first) and builds `TranscriptJob(**{k: row[k] for k in TranscriptJob.__dataclass_fields__})`; `mark_job_done(job_id, markdown_url, duration_seconds, *, video_id=None)` (calls `wake_dependents`); `mark_job_failed(job_id, error_message)` (RPC `increment_retry_and_fail(job_id, err_message)`, fallback update); `create_pending_job(video_id, language, user_id)` (skips on duplicate/unique error, no requeue); `find_done_transcript(video_id, language) -> dict|None`; `defer_for_dependency(job_id)`; `wake_dependents(video_id)` (RPC `wake_dependent_jobs(p_video_id)`); `download_markdown_from_storage(markdown_url) -> str` (urllib).
- `worker/src/pipeline/run.py` — `run_pipeline(job) -> PipelineResult`; EN → `_run_en_pipeline`; non-EN → `_run_translation_pipeline`: if EN not done → `create_pending_job(vid,"en",job.user_id)`, `defer_for_dependency(job.id)`, raise `DependencyPending`. Never sets done/failed.
- `worker/src/pipeline/upload_to_storage.py` — path `{vid[:2]}/{vid}/{lang}.md`, returns full public URL from worker `SUPABASE_URL`. Web tolerates relative URLs (`web/entities/transcript/ui/TranscriptCard.tsx`); CLI may too.
- `worker/src/models.py` — `TranscriptJob` (18 fields), `PipelineResult(markdown_url, duration_seconds)`, `DependencyPending(Exception)`.
- `worker/src/config.py` — `_require_env` at import for `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`; `POLL_INTERVAL_S`, `STALE_MINUTES`, `MAX_RETRIES`.
- Migrations: `grab_pending_transcript()` cannot target an id; status CHECK `pending, queued, processing, done, failed, waiting_dependency`; `UNIQUE(youtube_video_id, language)`, `UNIQUE(slug)`; worker's enrich rewrites slug from title after processing.
- `worker/pyproject.toml` — python >=3.12; deps yt-dlp, supabase, openai, python-dotenv, Unidecode; dev pytest, pytest-mock; `testpaths=["tests"]`; script `worker = "src.main:main"`. No HTTP lib; use urllib.
- `worker/tests/conftest.py` — env setdefaults (`SUPABASE_URL=http://localhost:56121`, keys) before importing `src`; fixtures `make_job` (defaults `youtube_video_id="abc123XYZ"`, `language="en"`, `user_id="user-001"`, `status="processing"`), `sample_segments`, `sample_metadata`, `sample_sections`, `sample_markdown`. No Supabase client fixture.
- `worker/tests/test_uc3_create_en_dependency.py` — stale: patches `src.pipeline.run.requeue_job` (now `defer_for_dependency`).
- `worker/agent.md` — English spec, intro + `## Use cases` / `### Use Case N` bullets with "Expected behavior:". No run/CLI docs.
- `readme.md` — `### Local development` explains `worker/.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`), API port 56121.

## Patterns to follow

- CLI module — like `worker/src/main.py` (docstring, `from __future__ import annotations`, `load_dotenv()` before config import, logging format, `def main() -> None`, `if __name__ == "__main__"`). Use argparse (stdlib).
- DB helpers — like `worker/src/db.py` (`sb = get_supabase()` locally, fluent `sb.table(...)...execute()`, `result.data`, docstring naming the caller).
- Tests — like `worker/tests/test_uc1_no_subs.py` (module docstring, `unittest.mock.patch` by import location e.g. `src.cli.<name>`, `make_job` fixture, typed `-> None`).
- Docs — `worker/agent.md` heading + bullets style.

## Conventions

- `load_dotenv()` must run before importing `src.config` (and modules that import it).
- EN slug = videoId, other languages `{videoId}-{lang}`; `user_id` None for CLI.
- Error text convention: `str(e) or "Unknown pipeline error"`; the no-subtitles error text is `No subtitles found`.
- Worker venv: `worker/.venv` has no packages; install with `cd worker && .venv/bin/python -m ensurepip && .venv/bin/python -m pip install -e '.[dev]'` (or recreate `python3 -m venv .venv`). Local only, never commit `.venv` or `worker/.env`.
- Never print or commit values from `worker/.env`. Public repo.
- Do not start, stop or modify any Supabase stack; tests are mock-only.

## Gaps found during implementation
- Worker venv: system python has no ensurepip; pip was bootstrapped into `worker/.venv` with get-pip.py; `pip install -e '.[dev]'` done. Use `cd worker && .venv/bin/pytest`.
- `increment_retry_and_fail` always sets `failed` (`supabase/migrations/20260305180000_worker_fields.sql`).
- Pre-existing failures: `test_uc3_create_en_dependency.py` x3 (stale `requeue_job`), `test_uc2_translate_from_en.py::test_translates_from_existing_en` and `test_uc4_no_en_subs.py` x2 (unmocked real OpenAI calls → 401).
- Group 1 API (`worker/src/cli.py`): `run(argv) -> int`, `main()`, `extract_video_id`, `ensure_jobs`, `wait_for_job`, `run_inline`, `deliver`; exit codes 0/1/2; `--timeout` seconds (default 900); `--lang` `^[a-z]{2}$`. `db.py`: `ACTIVE_STATUSES`, `submit_jobs`, `get_transcript`, `find_transcript`, `claim_job`.
