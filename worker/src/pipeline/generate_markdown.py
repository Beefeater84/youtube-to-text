from __future__ import annotations

from src.models import ProcessedSection


def generate_markdown(
    *,
    video_id: str,
    title: str,
    channel_name: str,
    duration: int,
    language: str,
    sections: list[ProcessedSection],
) -> str:
    """
    Build a Markdown file from processed sections and metadata.
    Output follows docs/transcript-format.md: YAML frontmatter + body with
    <!-- t:SECONDS --> comments before ## headings.
    """
    fm_sections = "\n".join(
        f'  - title: "{_escape_yaml(s.title)}"\n    timestamp: {s.timestamp}'
        for s in sections
    )

    frontmatter = (
        "---\n"
        f'video_id: "{video_id}"\n'
        f'title: "{_escape_yaml(title)}"\n'
        f'channel: "{_escape_yaml(channel_name)}"\n'
        f"duration: {duration}\n"
        f'language: "{language}"\n'
        f"sections:\n"
        f"{fm_sections}\n"
        "---"
    )

    body = "\n\n".join(
        f"<!-- t:{s.timestamp} -->\n## {s.title}\n\n{s.content}"
        for s in sections
    )

    return f"{frontmatter}\n\n{body}\n"


def _escape_yaml(text: str) -> str:
    """Escape double quotes inside YAML string values."""
    return text.replace('"', '\\"')
