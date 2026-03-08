from __future__ import annotations

import logging
import re

from src.db import create_sibling_transcript, enrich_transcript, find_or_create_channel
from src.models import FetchResult, PipelineResult, ProcessedSection, TranscriptJob, VideoMetadata
from src.pipeline.fetch_transcript import fetch_transcript
from src.pipeline.generate_markdown import generate_markdown
from src.pipeline.process_with_llm import process_with_llm
from src.pipeline.translate_with_llm import translate_sections
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
    Orchestrate the full transcript processing pipeline.
    Always produces an English transcript. If the video's original language
    is not English, also produces a transcript in the original language.
    Called by the main polling loop for each pending job.
    """
    target_lang = job.language or "en"

    logger.info("step 1/6: fetching transcript for %s", job.youtube_video_id)
    result: FetchResult = fetch_transcript(job.youtube_video_id, target_lang=target_lang)
    meta = result.metadata
    segments = result.segments
    source_lang = result.source_language

    logger.info("step 2/6: enriching DB record with metadata")
    channel_id = find_or_create_channel(meta.channel_name, meta.channel_id)
    base_slug = _slugify(meta.title)
    enrich_transcript(
        job.id,
        title=meta.title,
        slug=f"{base_slug}-{job.youtube_video_id}",
        thumbnail_url=meta.thumbnail_url,
        duration_seconds=meta.duration,
        channel_id=channel_id,
    )

    duration = meta.duration or (
        int(segments[-1].offset + segments[-1].duration) if segments else 0
    )

    logger.info(
        "step 3/6: processing with LLM (%d segments, source=%s)",
        len(segments), source_lang,
    )
    source_sections = process_with_llm(segments, source_language=source_lang)

    needs_translation = source_lang != target_lang

    if needs_translation:
        _publish_source_language(
            job=job,
            sections=source_sections,
            source_lang=source_lang,
            meta=meta,
            duration=duration,
            channel_id=channel_id,
            base_slug=base_slug,
        )

        logger.info("step 5/6: translating %s → %s", source_lang, target_lang)
        en_sections = translate_sections(source_sections, source_lang, target_lang)
    else:
        en_sections = source_sections

    logger.info(
        "step %s/6: generating markdown for %s (%d sections)",
        "6" if needs_translation else "4",
        target_lang, len(en_sections),
    )
    md = generate_markdown(
        video_id=job.youtube_video_id,
        title=meta.title,
        channel_name=meta.channel_name,
        duration=duration,
        language=target_lang,
        sections=en_sections,
    )

    logger.info("uploading %s transcript to storage", target_lang)
    markdown_url = upload_to_storage(job.youtube_video_id, target_lang, md)

    return PipelineResult(markdown_url=markdown_url, duration_seconds=duration)


def _publish_source_language(
    *,
    job: TranscriptJob,
    sections: list[ProcessedSection],
    source_lang: str,
    meta: VideoMetadata,
    duration: int,
    channel_id: str,
    base_slug: str,
) -> None:
    """
    Generate markdown and DB record for the video's original language.
    This is a side-effect of the main pipeline when source != target.
    """
    logger.info("step 4/6: publishing original-language (%s) transcript", source_lang)

    md = generate_markdown(
        video_id=job.youtube_video_id,
        title=meta.title,
        channel_name=meta.channel_name,
        duration=duration,
        language=source_lang,
        sections=sections,
    )

    md_url = upload_to_storage(job.youtube_video_id, source_lang, md)

    create_sibling_transcript(
        job,
        language=source_lang,
        slug=f"{base_slug}-{job.youtube_video_id}-{source_lang}",
        markdown_url=md_url,
        duration_seconds=duration,
        title=meta.title,
        thumbnail_url=meta.thumbnail_url,
        channel_id=channel_id,
    )
