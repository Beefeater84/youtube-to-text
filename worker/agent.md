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

- We receive a request to translate a video, and the video has no English subtitles.

Expected behavior:

- Detect the language of the video.
- Take the existing subtitles and send them for translation into English.
- Then follow the standard pipeline: cleaning and structuring with OpenAI, saving to Markdown, publishing on the website.