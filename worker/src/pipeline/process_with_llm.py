from __future__ import annotations

import json
import logging

from openai import OpenAI

from src import config
from src.models import ProcessedSection, RawSegment

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a professional transcript editor. Your job is to turn raw auto-generated \
subtitles into clean, readable written text in {language_name}.

CRITICAL RULES:
1. PRESERVE the speaker's original message, arguments, and phrasing as closely as \
possible. Do NOT summarize, shorten, or paraphrase. Keep every meaningful sentence.
2. REMOVE filler words and verbal tics (um, uh, like, you know, well, so, I mean, \
right, basically, actually, kind of, sort of — and their equivalents in {language_name}).
3. REMOVE stutters, false starts, and repeated words/phrases.
4. REMOVE ad reads, sponsor segments, self-promotion (like/subscribe reminders, \
channel plugs, merch mentions, Patreon plugs). If the speaker transitions back to \
the topic after an ad, keep only the topical content.
5. FIX grammar and punctuation so the text reads naturally as written prose. \
Break into proper paragraphs.
6. KEEP the language as {language_name} — do NOT translate.
7. DIVIDE the transcript into logical sections based on topic shifts. Each section \
needs a short descriptive title (max 80 chars) and the timestamp (in seconds) of \
its first segment.

OUTPUT FORMAT — respond with a single JSON object:
{{
  "sections": [
    {{
      "title": "Section title describing the topic",
      "timestamp": 0,
      "content": "Full cleaned text of this section as one or more paragraphs..."
    }}
  ]
}}

Aim for 3–10 sections depending on the length. Short videos (under 5 min) may have \
2–3 sections. Long videos (over 30 min) may have up to 15.
"""

_MAX_SEGMENTS_PER_CHUNK = 800


def process_with_llm(
    segments: list[RawSegment],
    source_language: str = "en",
) -> list[ProcessedSection]:
    """
    Clean up and structure raw transcript segments into logical sections via OpenAI.
    Output is always in the source language (no translation happens here).
    Called after fetch_transcript to clean up raw caption text.
    """
    if not segments:
        raise RuntimeError("No segments to process")

    if len(segments) <= _MAX_SEGMENTS_PER_CHUNK:
        return _call_llm(segments, source_language)

    all_sections: list[ProcessedSection] = []
    for i in range(0, len(segments), _MAX_SEGMENTS_PER_CHUNK):
        chunk = segments[i : i + _MAX_SEGMENTS_PER_CHUNK]
        logger.info(
            "processing chunk %d–%d of %d segments",
            i, min(i + _MAX_SEGMENTS_PER_CHUNK, len(segments)), len(segments),
        )
        all_sections.extend(_call_llm(chunk, source_language))

    logger.info("LLM produced %d sections total from %d segments", len(all_sections), len(segments))
    return all_sections


def _call_llm(
    segments: list[RawSegment],
    source_language: str,
) -> list[ProcessedSection]:
    """Send a batch of segments to OpenAI and parse the structured response."""
    client = OpenAI(api_key=config.OPENAI_API_KEY)
    language_name = _lang_code_to_name(source_language)
    system_prompt = _SYSTEM_PROMPT.format(language_name=language_name)
    segment_text = "\n".join(f"[{round(s.offset)}s] {s.text}" for s in segments)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": segment_text},
        ],
        temperature=0.3,
        max_tokens=16000,
    )

    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("Empty response from OpenAI")

    parsed = json.loads(content)
    sections = parsed.get("sections", [])
    if not isinstance(sections, list) or len(sections) == 0:
        raise RuntimeError("LLM returned no sections")

    return [
        ProcessedSection(
            title=s["title"],
            timestamp=int(s["timestamp"]),
            content=s["content"],
        )
        for s in sections
    ]


_LANG_NAMES: dict[str, str] = {
    "en": "English",
    "ru": "Russian",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "pt": "Portuguese",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "hi": "Hindi",
    "it": "Italian",
    "nl": "Dutch",
    "pl": "Polish",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "vi": "Vietnamese",
    "th": "Thai",
    "id": "Indonesian",
    "sv": "Swedish",
}


def _lang_code_to_name(code: str) -> str:
    """Map ISO 639-1 code to English language name for LLM prompts."""
    return _LANG_NAMES.get(code, code)
