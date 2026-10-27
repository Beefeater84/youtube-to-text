"""CLI: create a transcript for a YouTube video without the frontend.

Usage: python -m src.cli <url|id> [--lang xx] [--inline] [--out file.md] [--timeout N]

Submits jobs like the web submitTranscriptJob action, then either waits for the
running worker (default) or runs the pipeline in this process (--inline).
Progress goes to stderr; stdout carries only the Markdown URL (none with --out).
Exit codes: 0 done, 1 failed, 2 timeout or invalid input.
"""

from __future__ import annotations

import argparse
import logging
import re
import sys
import time
from collections.abc import Callable
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from src import config  # noqa: E402 — must load .env before config reads os.environ
from src.db import (  # noqa: E402
    claim_job,
    download_markdown_from_storage,
    find_transcript,
    get_transcript,
    mark_job_done,
    mark_job_failed,
    submit_jobs,
)
from src.models import DependencyPending  # noqa: E402
from src.pipeline.run import run_pipeline  # noqa: E402

logger = logging.getLogger("src.cli")

EXIT_DONE = 0
EXIT_FAILED = 1
EXIT_TIMEOUT = 2
EXIT_INVALID = 2

DEFAULT_TIMEOUT_S = 15 * 60

# Port of extractVideoId in web/features/create-transcript/ui/CreateTranscriptForm.tsx.
_VIDEO_URL_PATTERNS = (
    re.compile(r"youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})"),
    re.compile(r"youtu\.be/([a-zA-Z0-9_-]{11})"),
    re.compile(r"youtube\.com/embed/([a-zA-Z0-9_-]{11})"),
    re.compile(r"youtube\.com/shorts/([a-zA-Z0-9_-]{11})"),
)
_BARE_VIDEO_ID = re.compile(r"^[a-zA-Z0-9_-]{11}$")
_LANGUAGE_CODE = re.compile(r"^[a-z]{2}$")


class CliError(Exception):
    """Ends the CLI run with a message on stderr and the given exit code."""

    def __init__(self, message: str, exit_code: int = EXIT_FAILED) -> None:
        super().__init__(message)
        self.exit_code = exit_code


def extract_video_id(raw: str) -> str | None:
    """Return the 11-char YouTube video id from a URL or a bare id, or None."""
    value = raw.strip()
    for pattern in _VIDEO_URL_PATTERNS:
        match = pattern.search(value)
        if match:
            return match.group(1)
    if _BARE_VIDEO_ID.match(value):
        return value
    return None


def ensure_jobs(video_id: str, language: str) -> dict:
    """Return the target transcript row, submitting jobs first unless the
    requested language is already done (then nothing is written)."""
    row = find_transcript(video_id, language)
    if row is not None and row["status"] == "done":
        logger.info("%s/%s is already done", video_id, language)
        return row

    languages = ["en"] if language == "en" else ["en", language]
    submit_jobs(video_id, languages)

    row = find_transcript(video_id, language)
    if row is None:
        raise CliError(f"Job for {video_id}/{language} was not found after submit")
    logger.info("job %s for %s/%s is %s", row["id"], video_id, language, row["status"])
    return row


def wait_for_job(
    job_id: str,
    timeout_s: float,
    poll_interval_s: float,
    *,
    clock: Callable[[], float] = time.monotonic,
    sleep: Callable[[float], None] = time.sleep,
) -> dict:
    """Poll a job until it is done or failed, logging each status change.
    Raises CliError with EXIT_TIMEOUT when the timeout passes first."""
    deadline = clock() + timeout_s
    last_status: str | None = None

    while True:
        row = get_transcript(job_id)
        if row is None:
            raise CliError(f"Job {job_id} disappeared while waiting")

        status = row["status"]
        if status != last_status:
            logger.info("job %s: %s", job_id, status)
            last_status = status

        if status in ("done", "failed"):
            return row

        remaining = deadline - clock()
        if remaining <= 0:
            raise CliError(
                f"Timed out after {timeout_s:g}s waiting for job {job_id} "
                f"(last status: {status}); is the worker running?",
                EXIT_TIMEOUT,
            )
        sleep(min(poll_interval_s, remaining))


def _run_job_inline(job_id: str) -> str:
    """Claim one pending job and run the pipeline for it in this process,
    recording done/failed like the worker loop. Returns the markdown URL."""
    job = claim_job(job_id)
    if job is None:
        row = get_transcript(job_id)
        status = row["status"] if row else "missing"
        raise CliError(
            f"Job {job_id} is not pending (status: {status}); another worker may be "
            "processing it. Run without --inline to wait for it."
        )

    logger.info("processing job %s (video=%s, lang=%s)", job.id, job.youtube_video_id, job.language)
    try:
        result = run_pipeline(job)
    except DependencyPending as e:
        raise CliError(
            f"Job {job.id} still needs the EN transcript and was parked as "
            f"waiting_dependency ({e}). Run without --inline to wait for the worker."
        ) from e
    except Exception as e:
        message = str(e) or "Unknown pipeline error"
        mark_job_failed(job.id, message)
        raise CliError(f"Job {job.id} failed: {message}") from e

    mark_job_done(
        job.id,
        result.markdown_url,
        result.duration_seconds,
        video_id=job.youtube_video_id,
    )
    logger.info("job %s done", job.id)
    return result.markdown_url


def run_inline(target: dict) -> str:
    """Run the target job in this process. A non-EN target first runs its EN
    job (unless EN is already done); marking EN done wakes the target."""
    video_id = target["youtube_video_id"]
    if target["language"] != "en":
        en_row = find_transcript(video_id, "en")
        if en_row is None:
            raise CliError(f"EN job for {video_id} was not found")
        if en_row["status"] != "done":
            logger.info("running EN job %s first", en_row["id"])
            _run_job_inline(en_row["id"])
    return _run_job_inline(target["id"])


def absolute_markdown_url(markdown_url: str) -> str:
    """Prefix a relative storage URL with the worker's SUPABASE_URL."""
    if markdown_url.startswith(("http://", "https://")):
        return markdown_url
    return config.SUPABASE_URL.rstrip("/") + "/" + markdown_url.lstrip("/")


def deliver(markdown_url: str, out: Path | None) -> None:
    """Write the Markdown to `out`, or print its URL to stdout."""
    url = absolute_markdown_url(markdown_url)
    if out is None:
        print(url)
        return
    out.write_text(download_markdown_from_storage(url), encoding="utf-8")
    logger.info("wrote %s", out)


def _parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="python -m src.cli",
        description="Create a transcript for a YouTube video without the frontend.",
    )
    parser.add_argument("video", help="YouTube URL or 11-character video id")
    parser.add_argument("--lang", default="en", help="target language code (default: en)")
    parser.add_argument(
        "--inline",
        action="store_true",
        help="run the pipeline in this process instead of waiting for the worker",
    )
    parser.add_argument("--out", type=Path, help="write the Markdown to this file")
    parser.add_argument(
        "--timeout",
        type=float,
        default=DEFAULT_TIMEOUT_S,
        help=f"seconds to wait for the worker (default: {DEFAULT_TIMEOUT_S})",
    )
    return parser.parse_args(argv)


def run(argv: list[str] | None = None) -> int:
    """Run the CLI and return its exit code."""
    args = _parse_args(argv)

    video_id = extract_video_id(args.video)
    if video_id is None:
        logger.error("Invalid YouTube URL or video id: %s", args.video)
        return EXIT_INVALID

    language = args.lang.strip().lower()
    if not _LANGUAGE_CODE.match(language):
        logger.error("Invalid language code: %s", args.lang)
        return EXIT_INVALID

    try:
        target = ensure_jobs(video_id, language)
        if target["status"] == "done":
            markdown_url = target["markdown_url"]
        elif args.inline:
            markdown_url = run_inline(target)
        else:
            row = wait_for_job(target["id"], args.timeout, config.POLL_INTERVAL_S)
            if row["status"] == "failed":
                raise CliError(
                    f"Job {row['id']} failed: {row.get('error_message') or 'Unknown error'}"
                )
            markdown_url = row["markdown_url"]

        if not markdown_url:
            raise CliError(f"Job for {video_id}/{language} is done but has no markdown_url")
        deliver(markdown_url, args.out)
    except CliError as e:
        logger.error("%s", e)
        return e.exit_code

    return EXIT_DONE


def main() -> None:
    """Console entry point."""
    logging.basicConfig(
        level=logging.INFO,
        format="[cli] %(asctime)s %(levelname)s %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stderr,
    )
    sys.exit(run())


if __name__ == "__main__":
    main()
