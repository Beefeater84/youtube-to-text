import { createStaticClient } from "@/libs/supabase";
import type { VideoGroup } from "@/entities/transcript";

/**
 * Fetches paginated video groups for a specific channel.
 * Used on the channel detail page to list transcripts.
 */
export async function getChannelVideoGroups(
  channelId: string,
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
    .eq("channel_id", channelId)
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
 * Returns total count of unique videos for a channel with completed transcripts.
 * Using transcript count as a proxy for pagination count.
 */
export async function getChannelVideoGroupsCount(
  channelId: string,
): Promise<number> {
  const supabase = createStaticClient();

  const { count, error } = await supabase
    .from("transcripts")
    .select("*", { count: "exact", head: true })
    .eq("status", "done")
    .eq("channel_id", channelId);

  if (error || count === null) return 0;
  return count;
}
