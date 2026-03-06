from __future__ import annotations

import json
import logging
import os
import tempfile

import yt_dlp

from src.models import FetchResult, RawSegment, VideoMetadata

logger = logging.getLogger(__name__)

_TMP_DIR = os.path.join(tempfile.gettempdir(), "yt-dlp")


def fetch_transcript(video_id: str) -> FetchResult:
    """
    Extract video metadata and caption segments using the yt-dlp Python API.
    Called as the first step of the processing pipeline.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"

    os.makedirs(_TMP_DIR, exist_ok=True)

    ydl_opts: dict = {
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": ["en"],
        "subtitlesformat": "json3/vtt/srt/best",
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
        "outtmpl": os.path.join(_TMP_DIR, "%(id)s"),
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)

    if info is None:
        raise RuntimeError(f"yt-dlp returned no info for {video_id}")

    metadata = VideoMetadata(
        title=info.get("title", video_id),
        channel_name=info.get("channel", "Unknown"),
        channel_id=info.get("channel_id", ""),
        duration=info.get("duration", 0),
        thumbnail_url=info.get("thumbnail", ""),
        description=info.get("description", ""),
    )

    segments = _parse_subtitles(video_id)

    if not segments:
        raise RuntimeError(f"No captions found for video {video_id}")

    return FetchResult(metadata=metadata, segments=segments)


def _parse_subtitles(video_id: str) -> list[RawSegment]:
    """Read and parse the json3 subtitle file written by yt-dlp."""
    json3_path = os.path.join(_TMP_DIR, f"{video_id}.en.json3")

    if not os.path.exists(json3_path):
        vtt_path = os.path.join(_TMP_DIR, f"{video_id}.en.vtt")
        if os.path.exists(vtt_path):
            return _parse_vtt(vtt_path)
        return []

    with open(json3_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    segments: list[RawSegment] = []

    for event in data.get("events", []):
        segs = event.get("segs")
        if not segs:
            continue

        text = "".join(seg.get("utf8", "") for seg in segs).strip()
        if not text or text == "\n":
            continue

        segments.append(RawSegment(
            text=text,
            offset=event.get("tStartMs", 0) / 1000,
            duration=event.get("dDurationMs", 0) / 1000,
        ))

    _cleanup_tmp(video_id)
    return segments


def _parse_vtt(path: str) -> list[RawSegment]:
    """Fallback parser for VTT subtitle files."""
    import re

    segments: list[RawSegment] = []
    timestamp_re = re.compile(
        r"(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})"
    )

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    blocks = content.strip().split("\n\n")
    for block in blocks:
        lines = block.strip().split("\n")
        match = None
        text_lines: list[str] = []
        for line in lines:
            m = timestamp_re.match(line)
            if m:
                match = m
            elif match and line.strip():
                cleaned = re.sub(r"<[^>]+>", "", line.strip())
                if cleaned:
                    text_lines.append(cleaned)

        if match and text_lines:
            h, m, s, ms = int(match.group(1)), int(match.group(2)), int(match.group(3)), int(match.group(4))
            h2, m2, s2, ms2 = int(match.group(5)), int(match.group(6)), int(match.group(7)), int(match.group(8))
            start = h * 3600 + m * 60 + s + ms / 1000
            end = h2 * 3600 + m2 * 60 + s2 + ms2 / 1000
            segments.append(RawSegment(
                text=" ".join(text_lines),
                offset=start,
                duration=end - start,
            ))

    return segments


def _cleanup_tmp(video_id: str) -> None:
    """Remove temporary subtitle files after parsing."""
    for ext in (".en.json3", ".en.vtt", ".en.srt"):
        path = os.path.join(_TMP_DIR, f"{video_id}{ext}")
        if os.path.exists(path):
            os.remove(path)
