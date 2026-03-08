# Dashboard page
## Access rights
- Only authenticated users can view this page.

### Features and blocks

### Form for creating a new job
- It accepts a YouTube URL as input
- List of available languages for translating YouTube videos
- The client selects any language from the available options and submits the form.
- English is selected by default. The client can toggle it (uncheck/check), but when the form is submitted, EN is always included regardless of the selected languages.

**Use case 1:**

- Client selects a video
- Selects English

Expected behavior:

- A record with language en appears in the database

**Use case 2:**

- Client selects a video
- Selects Russian

Expected behavior:

- A record with language ru appears in the database
- A record with language en appears in the database


### Client's video list

- List of videos that were created by the user
- If a video is available in multiple languages, only one video entry is shown with an indication of which languages exist in the database.

