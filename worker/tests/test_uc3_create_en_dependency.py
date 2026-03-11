"""UC3: Non-EN job + EN transcript not in DB -> create EN job and requeue."""

from unittest.mock import patch

import pytest

from src.models import DependencyPending, TranscriptJob
from src.pipeline.run import run_pipeline


def test_creates_en_job_and_requeues(make_job) -> None:
    job: TranscriptJob = make_job(language="ru")

    with (
        patch("src.pipeline.run.find_done_transcript", return_value=None),
        patch("src.pipeline.run.create_pending_job") as mock_create,
        patch("src.pipeline.run.requeue_job") as mock_requeue,
    ):
        with pytest.raises(DependencyPending):
            run_pipeline(job)

    mock_create.assert_called_once_with("abc123XYZ", "en", "user-001")
    mock_requeue.assert_called_once_with("job-001")


def test_dependency_pending_message_contains_video_id(make_job) -> None:
    job: TranscriptJob = make_job(language="fr", youtube_video_id="myVideoXYZ")

    with (
        patch("src.pipeline.run.find_done_transcript", return_value=None),
        patch("src.pipeline.run.create_pending_job"),
        patch("src.pipeline.run.requeue_job"),
    ):
        with pytest.raises(DependencyPending, match="myVideoXYZ"):
            run_pipeline(job)


def test_requeue_called_before_exception(make_job) -> None:
    """Verify the job is requeued *before* the exception propagates,
    so it won't be stuck in processing if the caller doesn't catch."""
    job: TranscriptJob = make_job(language="de")
    requeue_called = False

    def track_requeue(job_id: str) -> None:
        nonlocal requeue_called
        requeue_called = True

    with (
        patch("src.pipeline.run.find_done_transcript", return_value=None),
        patch("src.pipeline.run.create_pending_job"),
        patch("src.pipeline.run.requeue_job", side_effect=track_requeue),
    ):
        with pytest.raises(DependencyPending):
            run_pipeline(job)

    assert requeue_called
