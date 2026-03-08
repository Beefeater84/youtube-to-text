from __future__ import annotations

from dataclasses import dataclass


@dataclass
class TranscriptJob:
    """Row from the transcripts table grabbed by the worker polling loop."""

    id: str
    channel_id: str | None
    youtube_video_id: str
    title: str
    description: str | None
    thumbnail_url: str | None
    slug: str
    language: str
    duration_seconds: int | None
    markdown_url: str | None
    status: str
    user_id: str | None
    published_at: str | None
    retry_count: int
    error_message: str | None
    started_at: str | None
    created_at: str
    updated_at: str


@dataclass
class RawSegment:
    """Single caption segment with timing info, extracted from yt-dlp json3."""

    text: str
    offset: float
    duration: float


@dataclass
class ProcessedSection:
    """Cleaned and structured transcript section produced by the LLM."""

    title: str
    timestamp: int
    content: str


@dataclass
class VideoMetadata:
    """Video metadata extracted from yt-dlp info dict."""

    title: str
    channel_name: str
    channel_id: str
    duration: int
    thumbnail_url: str
    description: str


@dataclass
class FetchResult:
    """Combined result of fetch_transcript: metadata + raw segments."""

    metadata: VideoMetadata
    segments: list[RawSegment]
    source_language: str


@dataclass
class PipelineResult:
    """Final result of the processing pipeline."""

    markdown_url: str
    duration_seconds: int
