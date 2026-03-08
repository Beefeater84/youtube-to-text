from __future__ import annotations

import json
import logging

from openai import OpenAI

from src import config
from src.models import ProcessedSection, RawSegment

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """You are a transcript editor. You receive raw YouTube caption segments with timestamps.

Your task:
1. Clean up the text: fix grammar, remove filler words ("um", "uh", "like", "you know"), merge broken sentences.
2. Group the segments into 4-12 logical sections based on topic shifts.
3. For each section, write a clean, descriptive heading (no timestamps or brackets in the heading).
4. The timestamp for each section is the offset (in seconds) of the first segment in that section.
5. Preserve the original meaning — do not add, invent, or editorialize content.
6. Keep the output in {language_name} — do NOT translate to another language.

Return a JSON object with this exact structure:
{{
  "sections": [
    {{
      "title": "Section Heading",
      "timestamp": 0,
      "content": "Cleaned paragraph text for this section..."
    }}
  ]
}}

Rules:
- Sections must be in chronological order (timestamps ascending).
- Each section should have at least 2-3 sentences of content.
- Do not include timestamps in headings or content text.
- Output ONLY the JSON object, no markdown fences or extra text."""


def process_with_llm(
    segments: list[RawSegment],
    source_language: str = "en",
) -> list[ProcessedSection]:
    """
    Send raw transcript segments to OpenAI for cleanup and structuring.
    Output is always in the source language (no translation happens here).
    Called after fetch_transcript to clean up raw caption text.
    """
    client = OpenAI(api_key=config.OPENAI_API_KEY)

    language_name = _lang_code_to_name(source_language)
    system_prompt = _SYSTEM_PROMPT.format(language_name=language_name)

    segment_text = "\n".join(
        f"[{round(s.offset)}s] {s.text}" for s in segments
    )

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
