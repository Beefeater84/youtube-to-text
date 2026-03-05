import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config.js";
import type { TranscriptJob } from "./types.js";

let client: SupabaseClient | null = null;

/**
 * Returns a Supabase admin client (service role, bypasses RLS).
 * Shared across the worker process lifetime.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  }
  return client;
}

/**
 * Atomically grabs the next pending transcript job using Postgres
 * FOR UPDATE SKIP LOCKED via the grab_pending_transcript RPC function.
 * Returns null when the queue is empty.
 */
export async function grabNextJob(): Promise<TranscriptJob | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("grab_pending_transcript");

  if (error) {
    console.error("[db] grab_pending_transcript error:", error.message);
    return null;
  }

  const rows = data as TranscriptJob[];
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Recovers stale jobs that have been stuck in "processing" state.
 * Called once on worker startup to handle crashes from previous runs.
 */
export async function recoverStaleJobs(): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("recover_stale_jobs", {
    stale_minutes: config.staleMinutes,
    max_retries: config.maxRetries,
  });

  if (error) {
    console.error("[db] recover_stale_jobs error:", error.message);
    return;
  }

  if (typeof data === "number" && data > 0) {
    console.log(`[db] recovered ${data} stale job(s)`);
  }
}

/**
 * Marks a transcript job as successfully completed with its storage URL.
 * Called at the end of the pipeline after uploading the markdown file.
 */
export async function markJobDone(
  jobId: string,
  markdownUrl: string,
  durationSeconds: number,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("transcripts")
    .update({
      status: "done",
      markdown_url: markdownUrl,
      duration_seconds: durationSeconds,
      published_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", jobId);

  if (error) {
    console.error("[db] markJobDone error:", error.message);
  }
}

/**
 * Marks a transcript job as failed with an error message.
 * Increments retry_count so the recovery function can track attempts.
 */
export async function markJobFailed(
  jobId: string,
  errorMessage: string,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("increment_retry_and_fail", {
    job_id: jobId,
    err_message: errorMessage,
  });

  if (error) {
    // Fallback: direct update without incrementing retry_count atomically
    await supabase
      .from("transcripts")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", jobId);
  }
}

/**
 * Ensures the Supabase Storage bucket for transcripts exists.
 * Called once on worker startup; safe to call multiple times.
 */
export async function ensureStorageBucket(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.storage.createBucket("transcripts", {
    public: true,
  });

  if (error && !error.message.includes("already exists")) {
    console.error("[db] createBucket error:", error.message);
  }
}
