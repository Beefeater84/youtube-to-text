"""Worker entry point: polls Postgres for pending jobs and processes them."""

from __future__ import annotations

import logging
import signal
import sys
import time

from dotenv import load_dotenv

load_dotenv()

from src import config  # noqa: E402 — must load .env before config reads os.environ
from src.db import (
    ensure_storage_bucket,
    grab_next_job,
    mark_job_done,
    mark_job_failed,
    recover_stale_jobs,
)
from src.models import DependencyPending
from src.pipeline.run import run_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="[worker] %(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

_shutting_down = False


def _handle_signal(signum: int, _frame: object) -> None:
    """Set shutdown flag on SIGINT/SIGTERM so the current job can finish."""
    global _shutting_down
    sig_name = signal.Signals(signum).name
    logger.info("received %s, finishing current job...", sig_name)
    _shutting_down = True


def main() -> None:
    """Main polling loop: grabs pending jobs from Postgres and runs the pipeline."""
    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    logger.info("starting...")

    recover_stale_jobs()
    ensure_storage_bucket()

    logger.info(
        "polling every %.1fs (stale=%dmin, maxRetries=%d)",
        config.POLL_INTERVAL_S,
        config.STALE_MINUTES,
        config.MAX_RETRIES,
    )

    while not _shutting_down:
        try:
            job = grab_next_job()

            if job is None:
                time.sleep(config.POLL_INTERVAL_S)
                continue

            logger.info("processing job %s (video=%s)", job.id, job.youtube_video_id)

            try:
                result = run_pipeline(job)
                mark_job_done(job.id, result.markdown_url, result.duration_seconds)
                logger.info("job %s done", job.id)
            except DependencyPending:
                logger.info("job %s waiting for EN dependency, requeued", job.id)
            except Exception as e:
                message = str(e) or "Unknown pipeline error"
                logger.error("job %s failed: %s", job.id, message)
                mark_job_failed(job.id, message)

        except Exception as e:
            logger.error("loop error: %s", e)
            time.sleep(config.POLL_INTERVAL_S)

    logger.info("shut down gracefully")


if __name__ == "__main__":
    main()
