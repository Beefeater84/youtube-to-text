from __future__ import annotations

import logging

# --- OpenAI DISABLED for v0.4 development (saving API limits) ---
# import json
# from openai import OpenAI
# from src import config
# --- END DISABLED ---

from src.models import ProcessedSection

logger = logging.getLogger(__name__)

# --- OpenAI DISABLED for v0.4 development ---
# _SYSTEM_PROMPT = """You are a professional translator. ..."""
# --- END DISABLED ---


def translate_sections(
    sections: list[ProcessedSection],
    source_language: str,
    target_language: str,
) -> list[ProcessedSection]:
    """
    Translate already-processed transcript sections from one language to another.
    Preserves section structure and timestamps; only titles and content are translated.
    Called by run_pipeline when source language differs from the target language.

    NOTE: OpenAI is temporarily disabled. Returns sections unchanged.
    """
    if source_language == target_language:
        return sections

    # --- OpenAI DISABLED for v0.4 development ---
    # client = OpenAI(api_key=config.OPENAI_API_KEY)
    # source_name = _lang_code_to_name(source_language)
    # target_name = _lang_code_to_name(target_language)
    # system_prompt = _SYSTEM_PROMPT.format(source_name=source_name, target_name=target_name)
    # sections_payload = json.dumps({"sections": [...]}, ensure_ascii=False)
    # response = client.chat.completions.create(...)
    # ... parse response ...
    # --- END DISABLED ---

    logger.info(
        "pass-through: returning %d sections unchanged (%s → %s)",
        len(sections), source_language, target_language,
    )
    return sections
