import { createStaticClient } from "@/libs/supabase";
import type { VideoGroup } from "../model/types";

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

  const { data, error } = await supabase
    .from("transcripts")
    .select(
      "youtube_video_id, title, slug, thumbnail_url, language, duration_seconds, created_at, channels(title, slug)",
    )
    .eq("status", "done")
    .order("created_at", { ascending: false });

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
  const start = (page - 1) * pageSize;
  return groups.slice(start, start + pageSize);
}

/**
 * Returns total count of unique videos with at least one completed transcript.
 * Used for pagination on the homepage.
 */
export async function getVideoGroupsTotalCount(): Promise<number> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("transcripts")
    .select("youtube_video_id")
    .eq("status", "done");

  if (error || !data) return 0;

  const unique = new Set(data.map((r) => r.youtube_video_id));
  return unique.size;
}
