-- v0.5: public storage bucket 'transcripts' for transcript files.
-- Created by migration so a fresh stack has it before the worker starts.
-- The worker's ensure_storage_bucket() stays as a fallback and is a no-op here.

------------------------------------------------------------
-- 1. Bucket 'transcripts' (public read), idempotent
------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('transcripts', 'transcripts', true)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public;
