import { createStaticClient } from "@/libs/supabase";
import { type VideoGroup, groupTranscriptsToVideos } from "@/entities/transcript";

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
      "youtube_video_id, title, slug, thumbnail_url, language, duration_seconds, created_at, markdown_url, channels(title, slug)",
    )
    .eq("status", "done")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error || !data) return [];

  return groupTranscriptsToVideos(data);
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
