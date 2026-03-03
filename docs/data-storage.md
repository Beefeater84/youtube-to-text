# Data Storage

How transcript data is stored across the system.

## Database (Supabase Postgres)

The database holds **metadata only**, never the full transcript text.

### `channels` table

One row per YouTube channel. Key fields: `youtube_id`, `title`, `slug`.

### `transcripts` table

One row per video transcript. Key fields:

| Field | Purpose |
|-------|---------|
| `youtube_video_id` | Unique YouTube video ID (e.g. `dQw4w9WgXcQ`) |
| `channel_id` | FK to `channels` |
| `slug` | URL-safe identifier for the transcript page |
| `language` | Language code of this transcript version |
| `duration_seconds` | Video length in seconds |
| `markdown_url` | URL to the `.md` file in storage |
| `status` | Pipeline state: `pending → queued → processing → done / failed` |
| `published_at` | When the transcript was made publicly available |

RLS policy: public read access (no auth required to query).

## File Storage (S3-compatible)

Transcript content is stored as Markdown files in an S3-compatible bucket.

### Path Convention

```
transcripts/{shard}/{videoId}/{lang}.md
```

- `shard` = first 2 characters of `videoId` (~4000 possible shards).
- All translations for one video live in the same directory.
- Example: `transcripts/Id/IdoVd4XHbDE/en.md`

### URL Resolution

The `markdown_url` field in the database contains the path to the file. During v0.1 development, files are served from `web/public/sample-transcripts/` as static assets. In production (v0.3+), files will be served from Supabase Storage or an S3-compatible CDN.

### Why Not Store Text in the Database

- Storage cost: Postgres storage is more expensive than object storage.
- CDN: S3/Supabase Storage has built-in CDN for global delivery.
- Decoupling: the rendering pipeline only needs a URL, not a DB query for content.
- Backup: files are independently versioned and backed up in object storage.

## Relationship Between Video ID and Data

A single YouTube video can have multiple transcript files (one per language). The `youtube_video_id` is the primary link between:

1. The `transcripts` row in the database (metadata).
2. The `.md` file in storage (content).
3. The YouTube embed on the page (video playback).
