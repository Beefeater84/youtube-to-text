-- v0.4: add 'waiting_dependency' status for non-EN jobs blocked on EN transcript.
-- Prevents infinite requeue loop: these jobs sleep until wake_dependent_jobs() is called.

------------------------------------------------------------
-- 1. Expand CHECK constraint to include 'waiting_dependency'
------------------------------------------------------------
ALTER TABLE public.transcripts
  DROP CONSTRAINT IF EXISTS transcripts_status_check;

ALTER TABLE public.transcripts
  ADD CONSTRAINT transcripts_status_check
  CHECK (status IN ('pending', 'queued', 'processing', 'done', 'failed', 'waiting_dependency'));

------------------------------------------------------------
-- 2. wake_dependent_jobs(video_id):
--    Move all waiting_dependency rows for a video back to pending.
--    Called after an EN transcript is marked done.
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.wake_dependent_jobs(
  p_video_id text
)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  woken integer;
BEGIN
  UPDATE public.transcripts
  SET status     = 'pending',
      started_at = NULL
  WHERE youtube_video_id = p_video_id
    AND status = 'waiting_dependency';

  GET DIAGNOSTICS woken = ROW_COUNT;
  RETURN woken;
END;
$$;

------------------------------------------------------------
-- 3. Update recover_stale_jobs() to handle waiting_dependency:
--    - If EN dep is done  → move to pending (missed wake)
--    - If EN dep is failed → move to failed
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recover_stale_jobs(
  stale_minutes integer DEFAULT 15,
  max_retries   integer DEFAULT 3
)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  recovered integer;
  woken    integer;
BEGIN
  -- Reset retriable stale processing jobs
  UPDATE public.transcripts
  SET status      = 'pending',
      started_at  = NULL,
      retry_count = retry_count + 1
  WHERE status = 'processing'
    AND started_at < now() - (stale_minutes || ' minutes')::interval
    AND retry_count < max_retries;

  GET DIAGNOSTICS recovered = ROW_COUNT;

  -- Fail non-retriable stale processing jobs
  UPDATE public.transcripts
  SET status        = 'failed',
      error_message = 'max retries exceeded (stale job recovery)'
  WHERE status = 'processing'
    AND started_at < now() - (stale_minutes || ' minutes')::interval
    AND retry_count >= max_retries;

  -- Wake waiting_dependency jobs whose EN dep is already done
  UPDATE public.transcripts t
  SET status     = 'pending',
      started_at = NULL
  WHERE t.status = 'waiting_dependency'
    AND EXISTS (
      SELECT 1 FROM public.transcripts en
      WHERE en.youtube_video_id = t.youtube_video_id
        AND en.language = 'en'
        AND en.status = 'done'
    );

  GET DIAGNOSTICS woken = ROW_COUNT;
  recovered := recovered + woken;

  -- Fail waiting_dependency jobs whose EN dep has failed
  UPDATE public.transcripts t
  SET status        = 'failed',
      error_message = 'EN dependency failed'
  WHERE t.status = 'waiting_dependency'
    AND EXISTS (
      SELECT 1 FROM public.transcripts en
      WHERE en.youtube_video_id = t.youtube_video_id
        AND en.language = 'en'
        AND en.status = 'failed'
    );

  RETURN recovered;
END;
$$;
