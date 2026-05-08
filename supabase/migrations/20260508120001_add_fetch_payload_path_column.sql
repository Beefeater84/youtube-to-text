-- Phase 6.1: store the Storage path of the pre-fetched payload uploaded by the extension.

ALTER TABLE public.transcripts
  ADD COLUMN fetch_payload_path TEXT NULL;
