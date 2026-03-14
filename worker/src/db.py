from __future__ import annotations

import logging
import urllib.request
from datetime import datetime, timezone

from supabase import create_client, Client

from src import config
from src.models import TranscriptJob
from src.slugify import slugify

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_supabase() -> Client:
    """Return a shared Supabase admin client (service role, bypasses RLS)."""
    global _client
    if _client is None:
        _client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
    return _client


def grab_next_job() -> TranscriptJob | None:
    """Atomically grab the next pending job via the grab_pending_transcript RPC."""
    sb = get_supabase()
    result = sb.rpc("grab_pending_transcript").execute()

    if not result.data:
        return None

    rows = result.data
    if len(rows) == 0:
        return None

    row = rows[0]
    return TranscriptJob(**{k: row[k] for k in TranscriptJob.__dataclass_fields__})


def recover_stale_jobs() -> None:
    """Reset jobs stuck in 'processing' state from previous crashes."""
    sb = get_supabase()
    result = sb.rpc(
        "recover_stale_jobs",
        {"stale_minutes": config.STALE_MINUTES, "max_retries": config.MAX_RETRIES},
    ).execute()

    recovered = result.data
    if isinstance(recovered, int) and recovered > 0:
        logger.info("recovered %d stale job(s)", recovered)


def ensure_storage_bucket() -> None:
    """Create the transcripts storage bucket if it doesn't exist."""
    sb = get_supabase()
    try:
        sb.storage.create_bucket("transcripts", options={"public": True})
    except Exception as e:
        if "already exists" not in str(e).lower():
            logger.error("createBucket error: %s", e)


def mark_job_done(
    job_id: str,
    markdown_url: str,
    duration_seconds: int,
    *,
    video_id: str | None = None,
) -> None:
    """Mark a transcript job as successfully completed.
    When video_id is provided, also wakes any non-EN jobs waiting on this video."""
    sb = get_supabase()
    sb.table("transcripts").update({
        "status": "done",
        "markdown_url": markdown_url,
        "duration_seconds": duration_seconds,
        "published_at": datetime.now(timezone.utc).isoformat(),
        "error_message": None,
    }).eq("id", job_id).execute()

    if video_id:
        wake_dependents(video_id)


def mark_job_failed(job_id: str, error_message: str) -> None:
    """Mark a transcript job as failed, incrementing retry count atomically."""
    sb = get_supabase()
    try:
        sb.rpc(
            "increment_retry_and_fail",
            {"job_id": job_id, "err_message": error_message},
        ).execute()
    except Exception:
        sb.table("transcripts").update({
            "status": "failed",
            "error_message": error_message,
        }).eq("id", job_id).execute()


def enrich_transcript(
    job_id: str,
    *,
    title: str,
    slug: str,
    thumbnail_url: str,
    duration_seconds: int,
    channel_id: str,
) -> None:
    """Update the transcript record with metadata fetched by the worker."""
    sb = get_supabase()
    sb.table("transcripts").update({
        "title": title,
        "slug": slug,
        "thumbnail_url": thumbnail_url,
        "duration_seconds": duration_seconds,
        "channel_id": channel_id,
    }).eq("id", job_id).execute()


def find_or_create_channel(channel_name: str, youtube_channel_id: str) -> str:
    """Find an existing channel by YouTube ID or create a new one. Returns channel UUID."""
    sb = get_supabase()
    slug = slugify(channel_name)

    result = sb.table("channels").select("id").eq("slug", slug).execute()

    if result.data and len(result.data) > 0:
        return result.data[0]["id"]

    result = sb.table("channels").insert({
        "youtube_id": youtube_channel_id,
        "title": channel_name,
        "slug": slug,
        "thumbnail_url": None,
    }).execute()

    return result.data[0]["id"]


def create_sibling_transcript(
    original_job: TranscriptJob,
    *,
    language: str,
    slug: str,
    markdown_url: str,
    duration_seconds: int,
    title: str,
    thumbnail_url: str | None,
    channel_id: str | None,
) -> None:
    """
    Create an additional transcript row for the same video in a different language.
    Used when the worker produces both the original-language and English versions.
    Skips silently if the (video, language) pair already exists.
    """
    sb = get_supabase()
    try:
        sb.table("transcripts").insert({
            "youtube_video_id": original_job.youtube_video_id,
            "language": language,
            "title": title,
            "slug": slug,
            "description": original_job.description,
            "thumbnail_url": thumbnail_url,
            "duration_seconds": duration_seconds,
            "channel_id": channel_id,
            "user_id": original_job.user_id,
            "markdown_url": markdown_url,
            "status": "done",
            "published_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            logger.info("sibling transcript already exists for %s/%s, skipping",
                        original_job.youtube_video_id, language)
        else:
            raise


def find_done_transcript(video_id: str, language: str) -> dict | None:
    """Find a completed transcript for the given video and language. Used by the
    translation pipeline to check whether the EN base version is ready."""
    sb = get_supabase()
    result = (
        sb.table("transcripts")
        .select("id, markdown_url, duration_seconds, title, thumbnail_url, channel_id")
        .eq("youtube_video_id", video_id)
        .eq("language", language)
        .eq("status", "done")
        .limit(1)
        .execute()
    )
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


def create_pending_job(
    video_id: str,
    language: str,
    user_id: str | None,
) -> None:
    """Create a pending transcript job. Skips silently if the (video, language)
    pair already exists. Used in UC3 to create the EN dependency job."""
    sb = get_supabase()
    slug = video_id if language == "en" else f"{video_id}-{language}"
    try:
        sb.table("transcripts").insert({
            "youtube_video_id": video_id,
            "language": language,
            "title": video_id,
            "slug": slug,
            "status": "pending",
            "user_id": user_id,
        }).execute()
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            logger.info("job already exists for %s/%s, skipping", video_id, language)
        else:
            raise


def defer_for_dependency(job_id: str) -> None:
    """Park a job in 'waiting_dependency' status until its EN dependency is done.
    These jobs are invisible to grab_pending_transcript and wake up automatically
    via wake_dependents() when the EN transcript completes."""
    sb = get_supabase()
    sb.table("transcripts").update({
        "status": "waiting_dependency",
        "started_at": None,
    }).eq("id", job_id).execute()


def wake_dependents(video_id: str) -> None:
    """Move all waiting_dependency jobs for a video back to pending.
    Called after an EN transcript is marked done so translations can proceed."""
    sb = get_supabase()
    result = sb.rpc("wake_dependent_jobs", {"p_video_id": video_id}).execute()
    woken = result.data
    if isinstance(woken, int) and woken > 0:
        logger.info("woke %d dependent job(s) for %s", woken, video_id)


def download_markdown_from_storage(markdown_url: str) -> str:
    """Download a markdown file from Supabase Storage by its public URL.
    Used in UC2 to fetch the EN transcript for translation."""
    with urllib.request.urlopen(markdown_url) as resp:
        return resp.read().decode("utf-8")
