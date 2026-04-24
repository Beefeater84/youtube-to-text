import type { MetadataRoute } from "next";
import { getAllTranscriptChannelSlugs } from "@/entities/transcript";
import { createStaticClient } from "@/libs/supabase";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getAllChannelSlugs(): Promise<string[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("channels")
    .select("slug")
    .order("slug");
  return (data ?? []).map((row) => row.slug);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [transcriptPairs, channelSlugs] = await Promise.all([
    getAllTranscriptChannelSlugs(),
    getAllChannelSlugs(),
  ]);

  const transcriptEntries: MetadataRoute.Sitemap = transcriptPairs.map(
    ({ channelSlug, transcriptSlug }) => ({
      url: `${BASE_URL}/${channelSlug}/${transcriptSlug}`,
      changeFrequency: "monthly",
      priority: 0.8,
    }),
  );

  const channelEntries: MetadataRoute.Sitemap = channelSlugs.map((slug) => ({
    url: `${BASE_URL}/channels/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    ...channelEntries,
    ...transcriptEntries,
  ];
}
