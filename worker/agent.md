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