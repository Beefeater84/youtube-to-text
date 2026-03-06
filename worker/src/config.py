from __future__ import annotations

import os


def _require_env(name: str) -> str:
    """Read an environment variable or fail fast with a clear message."""
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


SUPABASE_URL: str = _require_env("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY: str = _require_env("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY: str = _require_env("OPENAI_API_KEY")

POLL_INTERVAL_S: float = float(os.environ.get("POLL_INTERVAL_MS", "5000")) / 1000
STALE_MINUTES: int = int(os.environ.get("STALE_MINUTES", "15"))
MAX_RETRIES: int = int(os.environ.get("MAX_RETRIES", "3"))
