-- Phase 6.1: expand grab_pending_transcript to also pick up 'queued' rows that
-- already have a pre-fetched payload uploaded by the browser extension.
-- EN jobs are still prioritised so translations can depend on them.

CREATE OR REPLACE FUNCTION public.grab_pending_transcript()
RETURNS SETOF public.transcripts
LANGUAGE sql
VOLATILE
SECURITY DEFINER
AS $$
  UPDATE public.transcripts
  SET status     = 'processing',
      started_at = now()
  WHERE id = (
    SELECT id
    FROM public.transcripts
    WHERE status = 'pending'
       OR (status = 'queued' AND fetch_payload_path IS NOT NULL)
    ORDER BY (CASE WHEN language = 'en' THEN 0 ELSE 1 END), created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING *;
$$;
