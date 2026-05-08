-- Phase 6.1: reset jobs stuck in 'awaiting_browser_fetch' when the extension
-- never responds within the configured timeout window.

CREATE OR REPLACE FUNCTION public.recover_browser_stale_jobs(
  timeout_minutes integer DEFAULT 30
)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  recovered integer;
BEGIN
  UPDATE public.transcripts
  SET status     = 'pending',
      started_at = NULL
  WHERE status = 'awaiting_browser_fetch'
    AND now() - updated_at > make_interval(mins => timeout_minutes);

  GET DIAGNOSTICS recovered = ROW_COUNT;
  RETURN recovered;
END;
$$;
