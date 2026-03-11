"""UC2: Non-EN job + EN transcript already done in DB -> translate from EN."""

from unittest.mock import MagicMock, patch

from src.models import PipelineResult, TranscriptJob
from src.pipeline.run import run_pipeline


def test_translates_from_existing_en(make_job, sample_markdown) -> None:
    job: TranscriptJob = make_job(language="ru")

    en_record = {
        "id": "en-job-001",
        "markdown_url": "https://storage.example.com/ab/abc123XYZ/en.md",
        "duration_seconds": 300,
        "title": "Test Video Title",
        "thumbnail_url": "https://i.ytimg.com/vi/abc123XYZ/hqdefault.jpg",
        "channel_id": "channel-001",
    }

    with (
        patch("src.pipeline.run.find_done_transcript", return_value=en_record),
        patch("src.pipeline.run.download_markdown_from_storage", return_value=sample_markdown),
        patch("src.pipeline.run.enrich_transcript") as mock_enrich,
        patch("src.pipeline.run.upload_to_storage", return_value="https://storage.example.com/ab/abc123XYZ/ru.md") as mock_upload,
    ):
        result = run_pipeline(job)

    assert isinstance(result, PipelineResult)
    assert result.markdown_url == "https://storage.example.com/ab/abc123XYZ/ru.md"
    assert result.duration_seconds == 300

    mock_upload.assert_called_once()
    call_args = mock_upload.call_args
    assert call_args[0][0] == "abc123XYZ"
    assert call_args[0][1] == "ru"

    mock_enrich.assert_called_once()


def test_translate_pipeline_calls_translate_sections(make_job, sample_markdown) -> None:
    job: TranscriptJob = make_job(language="es")

    en_record = {
        "id": "en-job-001",
        "markdown_url": "https://storage.example.com/ab/abc123XYZ/en.md",
        "duration_seconds": 300,
        "title": "Test Video Title",
        "thumbnail_url": "",
        "channel_id": "",
    }

    with (
        patch("src.pipeline.run.find_done_transcript", return_value=en_record),
        patch("src.pipeline.run.download_markdown_from_storage", return_value=sample_markdown),
        patch("src.pipeline.run.translate_sections", wraps=lambda s, src, tgt: s) as mock_translate,
        patch("src.pipeline.run.enrich_transcript"),
        patch("src.pipeline.run.upload_to_storage", return_value="https://example.com/es.md"),
    ):
        run_pipeline(job)

    mock_translate.assert_called_once()
    args = mock_translate.call_args[0]
    assert args[1] == "en"
    assert args[2] == "es"


def test_translate_pipeline_fails_on_empty_markdown(make_job) -> None:
    job: TranscriptJob = make_job(language="ru")

    en_record = {
        "id": "en-job-001",
        "markdown_url": "https://storage.example.com/ab/abc123XYZ/en.md",
        "duration_seconds": 300,
        "title": "Test Video Title",
        "thumbnail_url": "",
        "channel_id": "",
    }

    import pytest
    with (
        patch("src.pipeline.run.find_done_transcript", return_value=en_record),
        patch("src.pipeline.run.download_markdown_from_storage", return_value=""),
    ):
        with pytest.raises(RuntimeError, match="Failed to parse EN markdown"):
            run_pipeline(job)
