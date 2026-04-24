import { createStaticClient } from "@/libs/supabase";
import type { VideoGroup, Transcript, TranscriptDashboardItem } from "../model/types";
import { groupTranscriptsToVideos } from "../lib/grouping";

/**
 * Fetches a paginated list of completed transcripts grouped by video.
 * Each VideoGroup represents one YouTube video with all available language versions.
 * Used on the homepage main content area.
 */
export async function getLatestVideoGroups(
  page: number = 1,
  pageSize: number = 20,
): Promise<VideoGroup[]> {
  const supabase = createStaticClient();
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, error } = await supabase
    .from("transcripts")
    .select(
      "youtube_video_id, title, slug, thumbnail_url, language, duration_seconds, created_at, markdown_url, channels(title, slug)",
    )
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error || !data) return [];

  return groupTranscriptsToVideos(data);
}

/**
 * Returns total count of unique videos with at least one completed transcript.
 * For true unique count via REST API, we'd need a view, but for now we'll count transcripts 
 * which is close enough or use the count features.
 */
export async function getVideoGroupsTotalCount(): Promise<number> {
  const supabase = createStaticClient();

  const { count, error } = await supabase
    .from("transcripts")
    .select("*", { count: "exact", head: true })
    .eq("status", "done");

  if (error || count === null) return 0;
  return count;
}

/**
 * Fetches user's transcripts for dashboard with pagination.
 */
export async function getUserTranscripts(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<TranscriptDashboardItem[]> {
  const supabase = createStaticClient();
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, error } = await supabase
    .from("transcripts")
    .select("*, channels(slug)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error || !data) return [];
  return data.map((row) => ({
    ...(row as Transcript),
    channel_slug: (row.channels as { slug: string } | null)?.slug ?? null,
  }));
}

/**
 * Returns total count of jobs/transcripts for a specific user.
 */
export async function getUserTranscriptsCount(
  userId: string,
): Promise<number> {
  const supabase = createStaticClient();

  const { count, error } = await supabase
    .from("transcripts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error || count === null) return 0;
  return count;
}
