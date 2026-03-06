from __future__ import annotations

import logging
import re

from src.db import enrich_transcript, find_or_create_channel
from src.models import FetchResult, PipelineResult, TranscriptJob
from src.pipeline.fetch_transcript import fetch_transcript
from src.pipeline.generate_markdown import generate_markdown
from src.pipeline.process_with_llm import process_with_llm
from src.pipeline.upload_to_storage import upload_to_storage

logger = logging.getLogger(__name__)


def _slugify(text: str) -> str:
    """Convert text to a URL-safe slug."""
    slug = text.lower()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    slug = slug.strip("-")
    return slug[:80]


def run_pipeline(job: TranscriptJob) -> PipelineResult:
    """
    Orchestrate the full transcript processing pipeline:
    fetch (yt-dlp) -> enrich DB record -> LLM cleanup -> markdown -> upload.
    Called by the main polling loop for each pending job.
    """
    logger.info("step 1/5: fetching transcript for %s", job.youtube_video_id)
    result: FetchResult = fetch_transcript(job.youtube_video_id)
    meta = result.metadata
    segments = result.segments

    logger.info("step 2/5: enriching DB record with metadata")
    channel_id = find_or_create_channel(meta.channel_name, meta.channel_id)
    slug = f"{_slugify(meta.title)}-{job.youtube_video_id}"
    enrich_transcript(
        job.id,
        title=meta.title,
        slug=slug,
        thumbnail_url=meta.thumbnail_url,
        duration_seconds=meta.duration,
        channel_id=channel_id,
    )

    logger.info("step 3/5: processing with LLM (%d segments)", len(segments))
    sections = process_with_llm(segments)

    duration = meta.duration or (
        int(segments[-1].offset + segments[-1].duration) if segments else 0
    )

    logger.info("step 4/5: generating markdown (%d sections)", len(sections))
    md = generate_markdown(
        video_id=job.youtube_video_id,
        title=meta.title,
        channel_name=meta.channel_name,
        duration=duration,
        language=job.language,
        sections=sections,
    )

    logger.info("step 5/5: uploading to storage")
    markdown_url = upload_to_storage(job.youtube_video_id, job.language, md)

    return PipelineResult(markdown_url=markdown_url, duration_seconds=duration)
