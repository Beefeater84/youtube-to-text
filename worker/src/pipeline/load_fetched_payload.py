from __future__ import annotations

import json
import logging

from src.db import get_supabase
from src.models import FetchResult, RawSegment, VideoMetadata

logger = logging.getLogger(__name__)


def load_fetched_payload(path: str) -> FetchResult:
    """Download and deserialise a pre-fetched browser-extension payload from Storage."""
    sb = get_supabase()
    raw = sb.storage.from_("fetch-payloads").download(path)
    data = json.loads(raw)

    meta_data = data["metadata"]
    metadata = VideoMetadata(
        title=meta_data["title"],
        channel_name=meta_data["channel_name"],
        channel_id=meta_data["channel_id"],
        duration=int(meta_data["duration"]),
        thumbnail_url=meta_data["thumbnail_url"],
        description=meta_data.get("description", ""),
    )

    segments = [
        RawSegment(
            text=s["text"],
            offset=float(s["offset"]),
            duration=float(s["duration"]),
        )
        for s in data["segments"]
    ]

    return FetchResult(
        metadata=metadata,
        segments=segments,
        source_language=data["source_language"],
    )
