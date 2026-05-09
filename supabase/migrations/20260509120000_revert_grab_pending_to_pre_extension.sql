-- Phase 6 cancelled: revert grab_pending_transcript to pre-extension logic.
-- Removes the 'queued + fetch_payload_path' branch; only 'pending' rows are picked up.

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
    ORDER BY (CASE WHEN language = 'en' THEN 0 ELSE 1 END), created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING *;
$$;
