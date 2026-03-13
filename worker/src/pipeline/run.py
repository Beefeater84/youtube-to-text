from __future__ import annotations

import logging

from src.db import (
    create_pending_job,
    create_sibling_transcript,
    download_markdown_from_storage,
    enrich_transcript,
    find_done_transcript,
    find_or_create_channel,
    requeue_job,
)
from src.models import (
    DependencyPending,
    FetchResult,
    PipelineResult,
    ProcessedSection,
    TranscriptJob,
    VideoMetadata,
)
from src.pipeline.fetch_transcript import fetch_transcript
from src.pipeline.generate_markdown import generate_markdown
from src.pipeline.parse_markdown import parse_markdown_to_sections
from src.pipeline.process_with_llm import process_with_llm
from src.pipeline.translate_with_llm import translate_sections
from src.pipeline.upload_to_storage import upload_to_storage
from src.slugify import slugify

logger = logging.getLogger(__name__)


def run_pipeline(job: TranscriptJob) -> PipelineResult:
    """Orchestrate the transcript processing pipeline. Routes to the EN pipeline
    (fetch + cleanup) or the translation pipeline (translate from existing EN)
    depending on the job's target language.
    Called by the main polling loop for each pending job."""
    target_lang = job.language or "en"

    if target_lang == "en":
        return _run_en_pipeline(job)
    else:
        return _run_translation_pipeline(job, target_lang)


def _run_en_pipeline(job: TranscriptJob) -> PipelineResult:
    """Process an EN job: fetch subtitles, clean up with LLM, generate markdown.
    Handles UC1 (no subs) and UC4 (no EN subs, fallback to another language)."""
    logger.info("step 1/5: fetching transcript for %s", job.youtube_video_id)
    result: FetchResult = fetch_transcript(job.youtube_video_id, target_lang="en")
    meta = result.metadata
    segments = result.segments
    source_lang = result.source_language

    logger.info("step 2/5: enriching DB record with metadata")
    channel_id = find_or_create_channel(meta.channel_name, meta.channel_id)
    base_slug = slugify(meta.title)
    enrich_transcript(
        job.id,
        title=meta.title,
        slug=base_slug,
        thumbnail_url=meta.thumbnail_url,
        duration_seconds=meta.duration,
        channel_id=channel_id,
    )

    duration = meta.duration or (
        int(segments[-1].offset + segments[-1].duration) if segments else 0
    )

    logger.info(
        "step 3/5: processing with LLM (%d segments, source=%s)",
        len(segments), source_lang,
    )
    source_sections = process_with_llm(segments, source_language=source_lang)

    needs_translation = source_lang != "en"

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

        logger.info("step 4/5: translating %s → en", source_lang)
        en_sections = translate_sections(source_sections, source_lang, "en")
    else:
        en_sections = source_sections

    logger.info("step 5/5: generating markdown for en (%d sections)", len(en_sections))
    md = generate_markdown(
        video_id=job.youtube_video_id,
        title=meta.title,
        channel_name=meta.channel_name,
        duration=duration,
        language="en",
        sections=en_sections,
    )

    logger.info("uploading en transcript to storage")
    markdown_url = upload_to_storage(job.youtube_video_id, "en", md)

    return PipelineResult(markdown_url=markdown_url, duration_seconds=duration)


def _run_translation_pipeline(
    job: TranscriptJob,
    target_lang: str,
) -> PipelineResult:
    """Process a non-EN job by translating from the existing EN transcript.
    UC2: EN exists in DB -> translate and save.
    UC3: EN not in DB -> create EN dependency and requeue."""
    en_record = find_done_transcript(job.youtube_video_id, "en")

    if en_record is None:
        logger.info("EN transcript not ready for %s, creating dependency", job.youtube_video_id)
        create_pending_job(job.youtube_video_id, "en", job.user_id)
        requeue_job(job.id)
        raise DependencyPending(
            f"EN transcript not ready for {job.youtube_video_id}, job requeued"
        )

    logger.info("step 1/4: downloading EN transcript for %s", job.youtube_video_id)
    en_markdown = download_markdown_from_storage(en_record["markdown_url"])

    logger.info("step 2/4: parsing EN markdown into sections")
    en_sections = parse_markdown_to_sections(en_markdown)
    if not en_sections:
        raise RuntimeError("Failed to parse EN markdown into sections")

    logger.info("step 3/4: translating en → %s (%d sections)", target_lang, len(en_sections))
    translated_sections = translate_sections(en_sections, "en", target_lang)

    duration = en_record.get("duration_seconds") or 0
    en_title = en_record.get("title") or job.youtube_video_id
    channel_id = en_record.get("channel_id")

    translated_title = translated_sections[0].title if translated_sections else en_title
    lang_slug = slugify(translated_title)
    enrich_transcript(
        job.id,
        title=en_title,
        slug=lang_slug,
        thumbnail_url=en_record.get("thumbnail_url") or "",
        duration_seconds=duration,
        channel_id=channel_id or "",
    )

    logger.info("step 4/4: generating markdown for %s (%d sections)", target_lang, len(translated_sections))
    md = generate_markdown(
        video_id=job.youtube_video_id,
        title=en_title,
        channel_name="",
        duration=duration,
        language=target_lang,
        sections=translated_sections,
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
    """Generate markdown and DB record for the video's original language.
    Side-effect of the EN pipeline when source != en (UC4)."""
    logger.info("publishing original-language (%s) transcript", source_lang)

    md = generate_markdown(
        video_id=job.youtube_video_id,
        title=meta.title,
        channel_name=meta.channel_name,
        duration=duration,
        language=source_lang,
        sections=sections,
    )

    md_url = upload_to_storage(job.youtube_video_id, source_lang, md)

    lang_slug = f"{base_slug}-{source_lang}"
    create_sibling_transcript(
        job,
        language=source_lang,
        slug=lang_slug,
        markdown_url=md_url,
        duration_seconds=duration,
        title=meta.title,
        thumbnail_url=meta.thumbnail_url,
        channel_id=channel_id,
    )
