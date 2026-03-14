from __future__ import annotations

import re

from unidecode import unidecode


def slugify(text: str) -> str:
    """Convert arbitrary text to an English URL-safe slug.

    Used for SEO-friendly slugs for transcripts and channels.
    """
    ascii_text = unidecode(text or "")
    slug = ascii_text.lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    slug = slug.strip("-")
    return slug[:80]

