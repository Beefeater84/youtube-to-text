from __future__ import annotations

import json
import logging

from openai import OpenAI

from src import config
from src.models import ProcessedSection
from src.pipeline.process_with_llm import _lang_code_to_name

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """You are a professional translator. You receive a structured transcript that has already been cleaned and organized into sections.

Translate ALL text (section titles and content) from {source_name} to {target_name}.

Rules:
1. Preserve the exact same section structure — same number of sections, same timestamps.
2. Translate naturally — produce fluent {target_name}, not word-by-word translation.
3. Keep proper nouns, brand names, and technical terms that are commonly used in their original form.
4. Do not add, remove, or reorder sections.

Return a JSON object with this exact structure:
{{
  "sections": [
    {{
      "title": "Translated Section Heading",
      "timestamp": 0,
      "content": "Translated paragraph text for this section..."
    }}
  ]
}}

Output ONLY the JSON object, no markdown fences or extra text."""


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

    client = OpenAI(api_key=config.OPENAI_API_KEY)

    source_name = _lang_code_to_name(source_language)
    target_name = _lang_code_to_name(target_language)

    system_prompt = _SYSTEM_PROMPT.format(
        source_name=source_name,
        target_name=target_name,
    )

    sections_payload = json.dumps(
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
            {"role": "user", "content": sections_payload},
        ],
        temperature=0.3,
        max_tokens=16000,
    )

    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("Empty response from OpenAI (translation)")

    parsed = json.loads(content)
    translated = parsed.get("sections", [])

    if not isinstance(translated, list) or len(translated) != len(sections):
        raise RuntimeError(
            f"Translation returned {len(translated)} sections, expected {len(sections)}"
        )

    return [
        ProcessedSection(
            title=t["title"],
            timestamp=sections[i].timestamp,
            content=t["content"],
        )
        for i, t in enumerate(translated)
    ]
