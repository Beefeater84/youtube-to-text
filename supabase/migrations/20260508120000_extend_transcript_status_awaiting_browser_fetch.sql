-- Phase 6.1: add 'awaiting_browser_fetch' status for jobs waiting on browser extension.

ALTER TABLE public.transcripts
  DROP CONSTRAINT IF EXISTS transcripts_status_check;

ALTER TABLE public.transcripts
  ADD CONSTRAINT transcripts_status_check
  CHECK (status IN (
    'pending',
    'queued',
    'processing',
    'done',
    'failed',
    'waiting_dependency',
    'awaiting_browser_fetch'
  ));
