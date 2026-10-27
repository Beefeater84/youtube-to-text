import { createStaticClient } from "@/libs/supabase";
import type { Channel, ChannelWithCount } from "../model/types";

type ChannelRowWithTranscripts = Channel & { transcripts: { id: string }[] | null };

/**
 * Fetches top channels sorted by number of completed transcripts.
 * Used on the homepage sidebar "Browse by Channel" section.
 */
export async function getTopChannels(
  limit: number = 5,
): Promise<ChannelWithCount[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("channels")
    .select("*, transcripts!inner(id)")
    .eq("transcripts.status", "done");

  if (error || !data) return [];

  return (data as ChannelRowWithTranscripts[])
    .map((ch) => ({
      id: ch.id,
      youtube_id: ch.youtube_id,
      title: ch.title,
      description: ch.description,
      thumbnail_url: ch.thumbnail_url,
      slug: ch.slug,
      transcript_count: Array.isArray(ch.transcripts)
        ? ch.transcripts.length
        : 0,
    }))
    .sort((a: ChannelWithCount, b: ChannelWithCount) => b.transcript_count - a.transcript_count)
    .slice(0, limit);
}
