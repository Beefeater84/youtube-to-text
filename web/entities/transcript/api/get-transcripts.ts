import { createStaticClient } from "@/libs/supabase";
import type { VideoGroup, Transcript } from "../model/types";

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
      "youtube_video_id, title, slug, thumbnail_url, language, duration_seconds, created_at, channels(title, slug)",
    )
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error || !data) return [];

  const groupMap = new Map<string, VideoGroup>();

  for (const row of data) {
    const langVersion = { language: row.language, slug: row.slug };
    const existing = groupMap.get(row.youtube_video_id);
    if (existing) {
      if (!existing.languages.some((l) => l.language === row.language)) {
        existing.languages.push(langVersion);
      }
    } else {
      const raw = row.channels;
      const ch = (Array.isArray(raw) ? raw[0] : raw) as
        | { title: string; slug: string }
        | null
        | undefined;
      groupMap.set(row.youtube_video_id, {
        youtube_video_id: row.youtube_video_id,
        title: row.title,
        slug: row.slug,
        thumbnail_url: row.thumbnail_url,
        channel_title: ch?.title ?? null,
        channel_slug: ch?.slug ?? null,
        languages: [langVersion],
        duration_seconds: row.duration_seconds,
        created_at: row.created_at,
      });
    }
  }

  const groups = Array.from(groupMap.values());
  return groups;
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
): Promise<Transcript[]> {
  const supabase = createStaticClient();
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, error } = await supabase
    .from("transcripts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error || !data) return [];
  return data as Transcript[];
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
