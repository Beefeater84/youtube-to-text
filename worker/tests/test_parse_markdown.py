"""Unit tests for parse_markdown_to_sections."""

from src.pipeline.parse_markdown import parse_markdown_to_sections


def test_parses_standard_markdown(sample_markdown: str) -> None:
    sections = parse_markdown_to_sections(sample_markdown)

    assert len(sections) == 2

    assert sections[0].title == "Introduction"
    assert sections[0].timestamp == 0
    assert "Welcome to this video" in sections[0].content

    assert sections[1].title == "Main Topic"
    assert sections[1].timestamp == 120
    assert "main topic in detail" in sections[1].content


def test_single_section() -> None:
    md = (
        "---\nvideo_id: \"x\"\n---\n\n"
        "<!-- t:42 -->\n## Only Section\n\nSome content here.\n"
    )
    sections = parse_markdown_to_sections(md)

    assert len(sections) == 1
    assert sections[0].title == "Only Section"
    assert sections[0].timestamp == 42
    assert sections[0].content == "Some content here."


def test_empty_string_returns_empty() -> None:
    assert parse_markdown_to_sections("") == []


def test_no_frontmatter() -> None:
    md = "<!-- t:0 -->\n## Heading\n\nContent.\n"
    sections = parse_markdown_to_sections(md)

    assert len(sections) == 1
    assert sections[0].title == "Heading"
    assert sections[0].content == "Content."


def test_multiline_content() -> None:
    md = (
        "---\nfoo: bar\n---\n\n"
        "<!-- t:10 -->\n## Multi\n\nLine one.\n\nLine two.\n"
    )
    sections = parse_markdown_to_sections(md)

    assert len(sections) == 1
    assert "Line one." in sections[0].content
    assert "Line two." in sections[0].content
