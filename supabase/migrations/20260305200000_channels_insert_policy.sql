-- Allow authenticated users to create channels when submitting transcripts.
-- Channels are a shared resource: any logged-in user may need to create one
-- if it doesn't already exist for the given YouTube author.

CREATE POLICY "Authenticated users can insert channels"
  ON channels
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
