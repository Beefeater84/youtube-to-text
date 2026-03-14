from __future__ import annotations

import json
import logging

from openai import OpenAI

from src import config
from src.models import ProcessedSection

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a professional translator from {source_name} to {target_name}.

RULES:
1. Translate the transcript sections faithfully, preserving the speaker's meaning, \
tone, and style. Do NOT summarize or shorten.
2. Translate BOTH the "title" and the "content" fields.
3. Keep the "timestamp" values exactly as they are — do NOT change them.
4. Preserve paragraph breaks inside "content".
5. Use natural, fluent {target_name} — not word-for-word machine translation.
6. Keep proper nouns, brand names, and technical terms that are commonly used \
untranslated in {target_name} (e.g. "Python", "GitHub", "API").

INPUT/OUTPUT FORMAT — you will receive a JSON object with a "sections" array. \
Return a JSON object with the same structure, same number of sections, same \
timestamps, but with translated "title" and "content":
{{
  "sections": [
    {{
      "title": "Translated section title",
      "timestamp": 0,
      "content": "Translated content..."
    }}
  ]
}}
"""

_MAX_SECTIONS_PER_CHUNK = 10


def translate_sections(
    sections: list[ProcessedSection],
    source_language: str,
    target_language: str,
) -> list[ProcessedSection]:
    """
    Translate already-processed transcript sections from one language to another.
    Preserves section structure and timestamps; only titles and content are translated.
    Called by run_pipeline when source language differs from the target language.
    """
    if source_language == target_language:
        return sections

    if len(sections) <= _MAX_SECTIONS_PER_CHUNK:
        return _call_llm(sections, source_language, target_language)

    all_translated: list[ProcessedSection] = []
    for i in range(0, len(sections), _MAX_SECTIONS_PER_CHUNK):
        chunk = sections[i : i + _MAX_SECTIONS_PER_CHUNK]
        logger.info(
            "translating chunk %d–%d of %d sections (%s → %s)",
            i, min(i + _MAX_SECTIONS_PER_CHUNK, len(sections)),
            len(sections), source_language, target_language,
        )
        all_translated.extend(_call_llm(chunk, source_language, target_language))

    return all_translated


def _call_llm(
    sections: list[ProcessedSection],
    source_language: str,
    target_language: str,
) -> list[ProcessedSection]:
    """Send sections to OpenAI for translation and parse the response."""
    client = OpenAI(api_key=config.OPENAI_API_KEY)
    source_name = _lang_code_to_name(source_language)
    target_name = _lang_code_to_name(target_language)
    system_prompt = _SYSTEM_PROMPT.format(source_name=source_name, target_name=target_name)

    payload = json.dumps(
        {
            "sections": [
                {
                    "title": s.title,
                    "timestamp": s.timestamp,
                    "content": s.content,
                }
                for s in sections
            ]
        },
        ensure_ascii=False,
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": payload},
        ],
        temperature=0.3,
        max_tokens=16000,
    )

    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("Empty response from OpenAI translation")

    parsed = json.loads(content)
    translated = parsed.get("sections", [])
    if not isinstance(translated, list) or len(translated) == 0:
        raise RuntimeError("LLM returned no translated sections")

    return [
        ProcessedSection(
            title=s["title"],
            timestamp=int(s["timestamp"]),
            content=s["content"],
        )
        for s in translated
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
