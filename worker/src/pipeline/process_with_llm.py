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

Return a JSON object with this exact structure:
{
  "sections": [
    {
      "title": "Section Heading",
      "timestamp": 0,
      "content": "Cleaned paragraph text for this section..."
    }
  ]
}

Rules:
- Sections must be in chronological order (timestamps ascending).
- Each section should have at least 2-3 sentences of content.
- Do not include timestamps in headings or content text.
- Output ONLY the JSON object, no markdown fences or extra text."""


def process_with_llm(segments: list[RawSegment]) -> list[ProcessedSection]:
    """
    Send raw transcript segments to OpenAI GPT-4o-mini for cleanup and structuring.
    Returns an ordered list of sections with clean titles, timestamps, and content.
    """
    client = OpenAI(api_key=config.OPENAI_API_KEY)

    segment_text = "\n".join(
        f"[{round(s.offset)}s] {s.text}" for s in segments
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
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
