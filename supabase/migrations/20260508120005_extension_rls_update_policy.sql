-- Phase 6.1: allow authenticated users to transition their own transcript row
-- from 'awaiting_browser_fetch' to 'queued' via the extension submit-fetch endpoint.
-- The API endpoint performs the same ownership check in code, so this policy is
-- defence-in-depth against direct Supabase client calls.

CREATE POLICY "extension_can_submit_own_fetch"
  ON public.transcripts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'awaiting_browser_fetch'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'queued'
    AND fetch_payload_path IS NOT NULL
  );
