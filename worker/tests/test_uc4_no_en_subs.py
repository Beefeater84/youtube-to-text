"""UC4: EN job but no EN subtitles on YouTube -> fallback language + translate to EN."""

from unittest.mock import patch

from src.models import (
    FetchResult,
    PipelineResult,
    RawSegment,
    TranscriptJob,
    VideoMetadata,
)
from src.pipeline.run import run_pipeline


def _make_fetch_result_es() -> FetchResult:
    """FetchResult simulating a video with only Spanish subtitles."""
    return FetchResult(
        metadata=VideoMetadata(
            title="Video en Espanol",
            channel_name="Canal Test",
            channel_id="UC_es123",
            duration=200,
            thumbnail_url="https://i.ytimg.com/vi/abc123XYZ/hqdefault.jpg",
            description="Un video de prueba",
        ),
        segments=[
            RawSegment(text="Hola mundo", offset=0.0, duration=3.0),
            RawSegment(text="Esta es una prueba", offset=3.0, duration=3.0),
            RawSegment(text="Adios", offset=6.0, duration=2.0),
        ],
        source_language="es",
    )


def test_en_job_with_spanish_fallback(make_job) -> None:
    job: TranscriptJob = make_job(language="en")

    with (
        patch("src.pipeline.run.fetch_transcript", return_value=_make_fetch_result_es()),
        patch("src.pipeline.run.find_or_create_channel", return_value="channel-es-001"),
        patch("src.pipeline.run.enrich_transcript"),
        patch("src.pipeline.run.create_sibling_transcript") as mock_sibling,
        patch("src.pipeline.run.upload_to_storage", return_value="https://storage.example.com/ab/abc123XYZ/en.md") as mock_upload,
    ):
        result = run_pipeline(job)

    assert isinstance(result, PipelineResult)
    assert result.markdown_url == "https://storage.example.com/ab/abc123XYZ/en.md"
    assert result.duration_seconds == 200

    # Source language (es) sibling should be published
    mock_sibling.assert_called_once()
    sibling_kwargs = mock_sibling.call_args[1]
    assert sibling_kwargs["language"] == "es"

    # EN upload should happen
    assert mock_upload.call_count == 2  # once for es sibling, once for en


def test_en_job_with_en_subs_no_translation(make_job, sample_segments, sample_metadata) -> None:
    """When EN subs are available directly, no translation or sibling should happen."""
    job: TranscriptJob = make_job(language="en")

    fetch_result = FetchResult(
        metadata=sample_metadata,
        segments=sample_segments,
        source_language="en",
    )

    with (
        patch("src.pipeline.run.fetch_transcript", return_value=fetch_result),
        patch("src.pipeline.run.find_or_create_channel", return_value="channel-001"),
        patch("src.pipeline.run.enrich_transcript"),
        patch("src.pipeline.run.create_sibling_transcript") as mock_sibling,
        patch("src.pipeline.run.translate_sections") as mock_translate,
        patch("src.pipeline.run.upload_to_storage", return_value="https://storage.example.com/en.md"),
    ):
        result = run_pipeline(job)

    assert isinstance(result, PipelineResult)
    mock_sibling.assert_not_called()
    mock_translate.assert_not_called()
