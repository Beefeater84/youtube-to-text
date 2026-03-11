from __future__ import annotations

import re

from src.models import ProcessedSection

_TIMESTAMP_RE = re.compile(r"<!--\s*t:(\d+)\s*-->")


def parse_markdown_to_sections(markdown: str) -> list[ProcessedSection]:
    """Parse a transcript markdown file back into ProcessedSection objects.
    Inverse of generate_markdown: strips YAML frontmatter, then splits by
    <!-- t:SECONDS --> markers extracting heading and content for each block.
    Used in UC2 to translate an existing EN transcript to another language."""
    body = _strip_frontmatter(markdown)

    parts = _TIMESTAMP_RE.split(body)

    if len(parts) < 3:
        return []

    sections: list[ProcessedSection] = []
    for i in range(1, len(parts), 2):
        timestamp = int(parts[i])
        block = parts[i + 1].strip() if i + 1 < len(parts) else ""

        title, content = _extract_heading_and_content(block)
        if title or content:
            sections.append(ProcessedSection(
                title=title,
                timestamp=timestamp,
                content=content,
            ))

    return sections


def _strip_frontmatter(markdown: str) -> str:
    """Remove YAML frontmatter (--- ... ---) from the beginning of the file."""
    stripped = markdown.lstrip()
    if not stripped.startswith("---"):
        return markdown

    end = stripped.find("---", 3)
    if end == -1:
        return markdown

    return stripped[end + 3:]


def _extract_heading_and_content(block: str) -> tuple[str, str]:
    """Split a section block into its ## heading and body content."""
    lines = block.split("\n")
    title = ""
    content_lines: list[str] = []

    for line in lines:
        if line.startswith("## ") and not title:
            title = line[3:].strip()
        else:
            content_lines.append(line)

    content = "\n".join(content_lines).strip()
    return title, content
