from __future__ import annotations

import json
import logging
import os
import tempfile
import urllib.request

import yt_dlp

from src.models import FetchResult, RawSegment, VideoMetadata

logger = logging.getLogger(__name__)

_TMP_DIR = os.path.join(tempfile.gettempdir(), "yt-dlp")


def fetch_transcript(video_id: str, target_lang: str = "en") -> FetchResult:
    """
    Extract video metadata and caption segments using a single yt-dlp call.
    If target_lang subtitles aren't available, falls back to the original
    language by downloading directly from the URL in the info dict.
    Called as the first step of the processing pipeline.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"
    os.makedirs(_TMP_DIR, exist_ok=True)

    ydl_opts: dict = {
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": [target_lang],
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

    segments = _parse_subtitles(video_id, target_lang)
    if segments:
        logger.info("subtitle language: %s (requested)", target_lang)
        return FetchResult(metadata=metadata, segments=segments, source_language=target_lang)

    fallback_lang = _pick_fallback_language(info, target_lang)
    if fallback_lang is None:
        raise RuntimeError(f"No subtitles available for video {video_id}")

    logger.info("no %s subtitles, falling back to %s", target_lang, fallback_lang)
    _download_subtitle_from_info(info, video_id, fallback_lang)

    segments = _parse_subtitles(video_id, fallback_lang)
    if not segments:
        raise RuntimeError(
            f"No captions found for {video_id} (tried {target_lang}, {fallback_lang})"
        )

    return FetchResult(metadata=metadata, segments=segments, source_language=fallback_lang)


def _pick_fallback_language(info: dict, exclude: str) -> str | None:
    """
    Choose the best fallback subtitle language from yt-dlp info dict,
    skipping the language that already failed. Prefers manual subs over auto.
    """
    subs = info.get("subtitles") or {}
    auto = info.get("automatic_captions") or {}

    for lang in subs:
        if lang != exclude and not lang.startswith("live_chat"):
            return lang

    original = info.get("language")
    if original and original != exclude and original in auto:
        return original

    for lang in auto:
        if lang != exclude and not lang.startswith("live_chat"):
            return lang

    return None


def _download_subtitle_from_info(info: dict, video_id: str, lang: str) -> None:
    """
    Download a subtitle file directly from the URL found in the yt-dlp info dict.
    Avoids a second yt-dlp session and the associated rate-limit risk.
    """
    subs = info.get("subtitles") or {}
    auto = info.get("automatic_captions") or {}
    formats = subs.get(lang) or auto.get(lang) or []

    preferred_ext = ("json3", "vtt", "srt")
    chosen = None
    for ext in preferred_ext:
        for fmt in formats:
            if fmt.get("ext") == ext:
                chosen = fmt
                break
        if chosen:
            break

    if not chosen and formats:
        chosen = formats[0]

    if not chosen:
        raise RuntimeError(f"No downloadable subtitle format for {lang}")

    ext = chosen.get("ext", "vtt")
    out_path = os.path.join(_TMP_DIR, f"{video_id}.{lang}.{ext}")

    logger.info("downloading %s subtitles (%s) directly", lang, ext)
    urllib.request.urlretrieve(chosen["url"], out_path)


def _parse_subtitles(video_id: str, lang: str) -> list[RawSegment]:
    """Read and parse the json3 subtitle file written by yt-dlp."""
    json3_path = os.path.join(_TMP_DIR, f"{video_id}.{lang}.json3")

    if not os.path.exists(json3_path):
        vtt_path = os.path.join(_TMP_DIR, f"{video_id}.{lang}.vtt")
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

    _cleanup_tmp(video_id, lang)
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


def _cleanup_tmp(video_id: str, lang: str) -> None:
    """Remove temporary subtitle files after parsing."""
    for ext in (f".{lang}.json3", f".{lang}.vtt", f".{lang}.srt"):
        path = os.path.join(_TMP_DIR, f"{video_id}{ext}")
        if os.path.exists(path):
            os.remove(path)
