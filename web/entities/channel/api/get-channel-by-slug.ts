import { createStaticClient } from "@/libs/supabase";
import type { ChannelWithCount } from "../model/types";

/**
 * Fetches a single channel by its URL slug, including transcript count.
 * Used on the channel detail page (/channels/[slug]).
 */
export async function getChannelBySlug(
  slug: string,
): Promise<ChannelWithCount | null> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("channels")
    .select("*, transcripts!inner(id)")
    .eq("slug", slug)
    .eq("transcripts.status", "done");

  if (error || !data || data.length === 0) return null;

  const ch = data[0] as any;
  return {
    id: ch.id,
    youtube_id: ch.youtube_id,
    title: ch.title,
    description: ch.description,
    thumbnail_url: ch.thumbnail_url,
    slug: ch.slug,
    transcript_count: Array.isArray(ch.transcripts)
      ? ch.transcripts.length
      : 0,
  };
}

/**
 * Returns all channel slugs that have at least one completed transcript.
 * Used for generateStaticParams on the channel page.
 */
export async function getAllChannelSlugs(): Promise<string[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("channels")
    .select("slug, transcripts!inner(id)")
    .eq("transcripts.status", "done");

  if (error || !data) return [];

  return data.map((ch: any) => ch.slug);
}
