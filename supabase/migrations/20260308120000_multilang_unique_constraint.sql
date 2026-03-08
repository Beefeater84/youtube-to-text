-- Allow multiple transcript rows per video (one per language).
-- Old constraint: youtube_video_id UNIQUE
-- New constraint: (youtube_video_id, language) UNIQUE

-- Drop the old single-column unique constraints
alter table public.transcripts
  drop constraint if exists transcripts_youtube_video_id_key;

alter table public.transcripts
  drop constraint if exists transcripts_slug_key;

-- Add composite unique constraint: one row per (video, language)
alter table public.transcripts
  add constraint transcripts_video_lang_unique
    unique (youtube_video_id, language);

-- Slug must still be unique across the table
alter table public.transcripts
  add constraint transcripts_slug_unique
    unique (slug);

-- Insert policy for service role (worker) creating sibling transcripts.
-- The worker uses service_role key which bypasses RLS, so no extra policy needed.
