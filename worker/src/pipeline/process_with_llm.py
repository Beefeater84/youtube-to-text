from __future__ import annotations

import logging

# --- OpenAI DISABLED for v0.4 development (saving API limits) ---
# import json
# from openai import OpenAI
# from src import config
# --- END DISABLED ---

from src.models import ProcessedSection, RawSegment

logger = logging.getLogger(__name__)

# --- OpenAI DISABLED for v0.4 development ---
# _SYSTEM_PROMPT = """You are a transcript editor. ..."""
# --- END DISABLED ---

_SEGMENTS_PER_SECTION = 20


def process_with_llm(
    segments: list[RawSegment],
    source_language: str = "en",
) -> list[ProcessedSection]:
    """
    Clean up and structure raw transcript segments into logical sections.
    Output is always in the source language (no translation happens here).
    Called after fetch_transcript to clean up raw caption text.

    NOTE: OpenAI is temporarily disabled. Segments are grouped mechanically.
    """
    # --- OpenAI DISABLED for v0.4 development ---
    # client = OpenAI(api_key=config.OPENAI_API_KEY)
    # language_name = _lang_code_to_name(source_language)
    # system_prompt = _SYSTEM_PROMPT.format(language_name=language_name)
    # segment_text = "\n".join(f"[{round(s.offset)}s] {s.text}" for s in segments)
    # response = client.chat.completions.create(
    #     model="gpt-4o-mini",
    #     response_format={"type": "json_object"},
    #     messages=[
    #         {"role": "system", "content": system_prompt},
    #         {"role": "user", "content": segment_text},
    #     ],
    #     temperature=0.3,
    #     max_tokens=16000,
    # )
    # content = response.choices[0].message.content
    # if not content:
    #     raise RuntimeError("Empty response from OpenAI")
    # parsed = json.loads(content)
    # sections = parsed.get("sections", [])
    # if not isinstance(sections, list) or len(sections) == 0:
    #     raise RuntimeError("LLM returned no sections")
    # return [
    #     ProcessedSection(
    #         title=s["title"],
    #         timestamp=int(s["timestamp"]),
    #         content=s["content"],
    #     )
    #     for s in sections
    # ]
    # --- END DISABLED ---

    if not segments:
        raise RuntimeError("No segments to process")

    sections: list[ProcessedSection] = []
    for i in range(0, len(segments), _SEGMENTS_PER_SECTION):
        chunk = segments[i : i + _SEGMENTS_PER_SECTION]
        sections.append(
            ProcessedSection(
                title=chunk[0].text[:80],
                timestamp=int(chunk[0].offset),
                content=" ".join(s.text for s in chunk),
            )
        )

    logger.info("pass-through: grouped %d segments into %d sections", len(segments), len(sections))
    return sections


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
