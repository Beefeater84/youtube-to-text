# Transcript Markdown Format

Specification for `.md` files that the worker produces and the frontend renders. This is the contract between the processing pipeline and the web application.

## Structure

Each file has two parts: YAML frontmatter and a Markdown body with timestamp comments.

## Frontmatter

Required fields:

| Field | Type | Description |
|-------|------|-------------|
| `video_id` | string | YouTube video ID |
| `title` | string | Video title |
| `channel` | string | Channel name |
| `duration` | integer | Video length in seconds |
| `language` | string | Language code (`en`, `ru`, etc.) |
| `sections` | array | Ordered list of `{ title, timestamp }` objects |

Each section entry has:
- `title` — section heading (must match the `## heading` in the body exactly).
- `timestamp` — start time in seconds from the beginning of the video.

## Body

- Sections are delimited by `## headings` (h2 level).
- Before each `## heading`, an HTML comment marks the timestamp: `<!-- t:SECONDS -->`.
- The heading text must be clean — no timestamps, no brackets, no extra markup.
- Paragraphs are plain text. Standard Markdown formatting is allowed (bold, italic, lists, links, blockquotes, code).

## Timestamp Comments

Format: `<!-- t:SECONDS -->` where SECONDS is a non-negative integer.

- Must appear on the line immediately before its `## heading`.
- Used by the frontend to inject clickable timestamp badges.
- Redundant with the frontmatter `sections` array by design (frontmatter for structured access, comments for positional mapping).

## Constraints

- One `##` heading per section (no duplicate heading text within a file).
- Sections must be in chronological order (timestamps ascending).
- No `# h1` headings in the body (the page provides its own h1 from the database title).
- File must be valid Markdown that renders correctly without any custom processing.
