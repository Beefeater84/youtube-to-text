from __future__ import annotations

from src.db import get_supabase


def upload_to_storage(video_id: str, language: str, markdown_content: str) -> str:
    """
    Upload a Markdown transcript file to Supabase Storage and return its public URL.
    Path convention: {shard}/{videoId}/{lang}.md where shard = first 2 chars of videoId.
    """
    sb = get_supabase()
    shard = video_id[:2]
    path = f"{shard}/{video_id}/{language}.md"

    sb.storage.from_("transcripts").upload(
        path,
        markdown_content.encode("utf-8"),
        file_options={"content-type": "text/markdown", "upsert": "true"},
    )

    res = sb.storage.from_("transcripts").get_public_url(path)
    return res
