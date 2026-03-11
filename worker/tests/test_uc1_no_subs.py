"""UC1: Video has no subtitles at all -> job fails with clear error."""

from unittest.mock import patch

import pytest

from src.models import TranscriptJob
from src.pipeline.run import run_pipeline


def test_no_subtitles_raises_runtime_error(make_job) -> None:
    job: TranscriptJob = make_job(language="en")

    with patch(
        "src.pipeline.run.fetch_transcript",
        side_effect=RuntimeError("No subtitles available for video abc123XYZ"),
    ):
        with pytest.raises(RuntimeError, match="No subtitles"):
            run_pipeline(job)


def test_no_subtitles_error_message_is_descriptive(make_job) -> None:
    job: TranscriptJob = make_job(language="en", youtube_video_id="noSubsVid")

    with patch(
        "src.pipeline.run.fetch_transcript",
        side_effect=RuntimeError("No subtitles available for video noSubsVid"),
    ):
        with pytest.raises(RuntimeError) as exc_info:
            run_pipeline(job)

        assert "noSubsVid" in str(exc_info.value)
