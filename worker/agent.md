# Worker agent

High-level understanding. This is the API function that sends jobs from the web app into the database (see `web/features/create-transcript/api/agent.md`).

The worker checks the database every 5 seconds for jobs with status `"pending"`.

## Use cases

### Use Case 1

- The video has no subtitles at all.

Expected behavior:

- Save status `"error"` in the database.
- Save error message `"No subtitles found"` in the database.
- Return error `"No subtitles found"`.

### Use Case 2

- We receive a request to translate a video into a **non-English** language.
- We already have a record for this video in English in the database.

Expected behavior:

We always expect that one of the languages in the job will be English.

- Check if this video in English already exists in the database.
- Take the Markdown file with the English transcript and send it for translation.
- Save the Markdown file with the **non-English** translation in the database.
- Save status `"done"` in the database.
- Return `success: true`.

### Use Case 3

- We receive a request to translate a video into a **non-English** language.
- We do **not** have a record for this video in English in the database.

Expected behavior:

- Create a database record for this video in English.
- Prioritize the job that translates this video into English over other jobs.
- Set the current job status to `"pending"`.
- Return `success: true`.

### Use Case 4

- We receive a request to process a video whose original language is not English.
- The video may or may not have auto-translated English subtitles on YouTube.

Expected behavior:

- Prefer the video's original-language subtitles (manual or auto-generated from speech) over YouTube's auto-translated English.
- Clean and structure the original-language transcript with LLM.
- Publish the original-language transcript as a sibling record.
- **Translate the channel name** to English using LLM if it's not already in English.
- Update the `channels` record with the English title and slug.
- Translate the cleaned transcript into English with LLM.
- Then follow the standard pipeline: saving to Markdown, publishing on the website using English metadata (title and channel title).
## CLI

Create a transcript without the frontend. The CLI submits jobs like the web action (EN is always included; `failed` and `pending` rows are re-queued; missing languages are inserted with no user), then waits for the worker or runs the pipeline itself.

Setup:

- Run from `worker/` with the worker venv: `.venv/bin/python -m src.cli ...`.
- `worker/.env` must contain `SUPABASE_URL` (= `API_URL`) and `SUPABASE_SERVICE_ROLE_KEY` (= `SERVICE_ROLE_KEY`) from `npx supabase status -o env`, plus `OPENAI_API_KEY`.

Commands:

- Wait for the running worker (default): `.venv/bin/python -m src.cli https://youtu.be/dQw4w9WgXcQ`. Prints status changes (`pending` → `processing` → `done`/`failed`) to stderr and the Markdown URL to stdout.
- Run in this process: `.venv/bin/python -m src.cli dQw4w9WgXcQ --inline`. Needs no running worker. A worker running in parallel may grab the job first; then the CLI exits with an error and you can rerun without `--inline` to wait for it.
- Non-English: `.venv/bin/python -m src.cli dQw4w9WgXcQ --lang ru --inline`. With `--inline`, the EN job runs first (skipped when EN is already done), then the translation.
- Save the Markdown to a file: `--out transcript.md` (nothing is printed to stdout).
- Wait limit: `--timeout 600` (seconds, default 900). Only used in wait mode.
- Input: a `youtube.com/watch?v=`, `youtu.be/`, `/embed/` or `/shorts/` URL, or a bare 11-character video id.
- If the requested language is already `done`, the CLI returns it immediately and writes nothing.

Exit codes:

- `0`: done.
- `1`: the job failed; the error message (e.g. `No subtitles found`) is printed to stderr.
- `2`: timeout, invalid URL/video id, or invalid `--lang`.
