from __future__ import annotations

import os

os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")

import pytest

from src.models import (
    FetchResult,
    ProcessedSection,
    RawSegment,
    TranscriptJob,
    VideoMetadata,
)


def _make_job(**overrides: object) -> TranscriptJob:
    """Build a TranscriptJob with sensible defaults, overridable per test."""
    defaults = {
        "id": "job-001",
        "channel_id": None,
        "youtube_video_id": "abc123XYZ",
        "title": "abc123XYZ",
        "description": None,
        "thumbnail_url": None,
        "slug": "abc123XYZ",
        "language": "en",
        "duration_seconds": None,
        "markdown_url": None,
        "status": "processing",
        "user_id": "user-001",
        "published_at": None,
        "retry_count": 0,
        "error_message": None,
        "started_at": "2026-03-11T12:00:00Z",
        "created_at": "2026-03-11T11:00:00Z",
        "updated_at": "2026-03-11T12:00:00Z",
    }
    defaults.update(overrides)
    return TranscriptJob(**defaults)


@pytest.fixture
def make_job():
    """Factory fixture that creates a TranscriptJob with optional overrides."""
    return _make_job


@pytest.fixture
def sample_segments() -> list[RawSegment]:
    """Three simple RawSegment objects for pipeline tests."""
    return [
        RawSegment(text="Hello world", offset=0.0, duration=3.0),
        RawSegment(text="This is a test", offset=3.0, duration=3.0),
        RawSegment(text="Goodbye", offset=6.0, duration=2.0),
    ]


@pytest.fixture
def sample_metadata() -> VideoMetadata:
    """Minimal VideoMetadata for pipeline tests."""
    return VideoMetadata(
        title="Test Video Title",
        channel_name="Test Channel",
        channel_id="UC_test123",
        duration=300,
        thumbnail_url="https://i.ytimg.com/vi/abc123XYZ/hqdefault.jpg",
        description="A test video",
    )


@pytest.fixture
def sample_sections() -> list[ProcessedSection]:
    """Two ProcessedSection objects for translation and markdown tests."""
    return [
        ProcessedSection(
            title="Introduction",
            timestamp=0,
            content="Welcome to this video about testing.",
        ),
        ProcessedSection(
            title="Main Topic",
            timestamp=120,
            content="Now let us discuss the main topic in detail.",
        ),
    ]


@pytest.fixture
def sample_markdown() -> str:
    """A valid transcript markdown string matching generate_markdown output."""
    return (
        '---\n'
        'video_id: "abc123XYZ"\n'
        'title: "Test Video Title"\n'
        'channel: "Test Channel"\n'
        'duration: 300\n'
        'language: "en"\n'
        'sections:\n'
        '  - title: "Introduction"\n'
        '    timestamp: 0\n'
        '  - title: "Main Topic"\n'
        '    timestamp: 120\n'
        '---\n'
        '\n'
        '<!-- t:0 -->\n'
        '## Introduction\n'
        '\n'
        'Welcome to this video about testing.\n'
        '\n'
        '<!-- t:120 -->\n'
        '## Main Topic\n'
        '\n'
        'Now let us discuss the main topic in detail.\n'
    )
