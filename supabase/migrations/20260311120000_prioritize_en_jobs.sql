-- v0.4: prioritize EN jobs so non-EN translations can depend on them.
-- EN jobs are always processed before non-EN for the same created_at window.

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
