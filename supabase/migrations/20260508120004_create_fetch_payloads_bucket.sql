-- Phase 6.1: private bucket for browser-extension payload uploads.
-- Only the service role can read/write; the user JWT is never exposed here.

INSERT INTO storage.buckets (id, name, public)
VALUES ('fetch-payloads', 'fetch-payloads', false)
ON CONFLICT (id) DO NOTHING;

-- Service-role bypass: the worker and the API route both use the admin client,
-- so no RLS policy is needed beyond the implicit service-role override.
-- Explicitly deny public access.
CREATE POLICY "deny_public_fetch_payloads_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fetch-payloads' AND false);
