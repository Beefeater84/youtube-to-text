# inline-md-runs

Transcripts made with the worker CLI in inline mode, kept as reference context.

```bash
cd worker
.venv/bin/python -m src.cli <youtube-url-or-id> --inline --out ../inline-md-runs/<videoId>-en.md
```

See `worker/agent.md` → CLI. Files follow `docs/transcript-format.md`.

`4Qh7C5AA34o-en.md` was built from the Arabic auto-dub track (translated back to English) because of #36. `MxBZjnayQUM-en.md` was built from the original English track (`en-orig`) with a one-off override of the subtitle picker.

`6N6H_KQxPWE-en.md` was translated from the Russian track (the video has no English subtitles); the original is kept as `6N6H_KQxPWE-ru.md` (`--lang ru --out ...`).

`3cizyWQbfQc-en.md` was built from the original English track (`en-orig`) with the same one-off override; the default run picked the Arabic auto-dub (#36).
