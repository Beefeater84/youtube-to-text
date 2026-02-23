# Project thoughts (youtube-to-text)

*Dump ideas and requirements here in English. Plan will be formed later.*

---

## Project

- **What it is:** A project for turning YouTube videos into readable text.
- **Main goal:** Be able to read the content sometimes faster than watching the full video.

---

## How it works

1. **Input:** User provides a video URL (e.g. `https://youtu.be/IdoVd4XHbDE?si=PE_0wmEA9TT4k52x`).
2. **Transcript:** Service fetches the video transcript.
3. **Cleanup:** Errors in the transcript are removed (most likely using AI).
4. **Structure:** Text is split into blocks and headings are added.
5. **Language:** Text is always translated to English. User has the option to translate to any other language.
6. **Timestamps:** Store the start timestamp of each section so the user can jump to that point in the original video and watch it.

---

## Storage

- Storing full video texts in the database is too expensive.
- **Translations:** Save as Markdown (`.md`) files and store them on S3.
- **Database:** Store only the link/URL to the file, not the content.
- **Frontend:** Upload the file and render it as MD components (markdown-rendered UI).

---

## SEO & hosting

- Main traffic is expected to come from SEO.
- Pages should ideally be **static** so we don’t pay for every request to the server.

---

## Access & monetization

- **Reading:** Anyone can read the texts (no auth required).
- **Creating:** Only registered users can create new transcriptions.
- **Payment:** Likely token-based payment (users pay in tokens to create/process videos).

---

## Video metadata

- For each video we store the **channel** (so we can list all videos from a given channel).
- Ideally store **tags** as well, so we can browse by topic/theme.

---

## Future: semantic search

- Put all texts in a **vector database** so users can search by meaning (semantic search).
- User can ask any question and get relevant content from the transcripts.
- **Filters:** Ideally support constraints on the search, e.g. "I'm looking for business information" with a filter like "source must be Y Combinator channel" (limit results to a specific channel or topic).

---

## Tech stack

- **Frontend:** React 19, Tailwind CSS.
- **Database:** Supabase.

---

## Long-running work (translation)

- Free hosting tiers limit **function execution time**; translating text is a long-running operation.
- Run translation in a **separate Lambda** (or Supabase Edge/background function) so it isn’t bound by the same timeout as the main API.
