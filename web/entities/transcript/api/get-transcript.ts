import { cache } from "react";
import { createStaticClient } from "@/libs/supabase";
import type { LanguageVersion, TranscriptWithChannel } from "../model/types";

/** Fetches a single done transcript by slug with joined channel data. */
export async function getTranscriptBySlug(
  slug: string,
): Promise<TranscriptWithChannel | null> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("transcripts")
    .select("*, channels(*)")
    .eq("slug", slug)
    .eq("status", "done")
    .single();

  if (error || !data) return null;
  return data as TranscriptWithChannel;
}

/** Returns all done transcript slugs for SSG (generateStaticParams). */
export async function getAllTranscriptSlugs(): Promise<string[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("transcripts")
    .select("slug")
    .eq("status", "done");

  if (error || !data) return [];
  return data.map((row) => row.slug);
}

/** Returns all {channelSlug, transcriptSlug} pairs for SSG (generateStaticParams). */
export async function getAllTranscriptChannelSlugs(): Promise<
  { channelSlug: string; transcriptSlug: string }[]
> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("transcripts")
    .select("slug, channels(slug)")
    .eq("status", "done");

  if (error || !data) return [];
  return data
    .filter((row) => (row.channels as { slug: string }[] | null)?.[0]?.slug)
    .map((row) => ({
      channelSlug: (row.channels as { slug: string }[])[0].slug,
      transcriptSlug: row.slug,
    }));
}

/** Downloads Markdown content from storage URL with ISR caching. */
export async function fetchTranscriptMarkdown(
  url: string,
): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

/**
 * Loads the transcript and all its language siblings by channel + transcript slug.
 * Cached per-request via React `cache` so generateMetadata and the page
 * component share the result without duplicate DB calls.
 */
export const getTranscriptPageDataByChannelAndSlug = cache(
  async (channelSlug: string, transcriptSlug: string) => {
    const supabase = createStaticClient();

    const { data, error } = await supabase
      .from("transcripts")
      .select("*, channels(*)")
      .eq("slug", transcriptSlug)
      .eq("status", "done")
      .single();

    if (error || !data) return { transcript: null, languages: [] };

    const transcript = data as TranscriptWithChannel;

    // Verify the transcript belongs to the expected channel (SEO isolation)
    if (transcript.channels?.slug !== channelSlug) return { transcript: null, languages: [] };

    const { data: siblings } = await supabase
      .from("transcripts")
      .select("language, slug")
      .eq("youtube_video_id", transcript.youtube_video_id)
      .eq("status", "done")
      .order("language");

    const languages: LanguageVersion[] = (siblings ?? []).sort((a, b) =>
      a.language === "en" ? -1 : b.language === "en" ? 1 : 0,
    );

    return { transcript, languages };
  },
);

/**
 * Loads the transcript and all its language siblings.
 * Cached per-request via React `cache` so generateMetadata and the page
 * component share the result without duplicate DB calls.
 */
export const getTranscriptPageData = cache(async (slug: string) => {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("transcripts")
    .select("*, channels(*)")
    .eq("slug", slug)
    .eq("status", "done")
    .single();

  if (error || !data) return { transcript: null, languages: [] };

  const transcript = data as TranscriptWithChannel;

  const { data: siblings } = await supabase
    .from("transcripts")
    .select("language, slug")
    .eq("youtube_video_id", transcript.youtube_video_id)
    .eq("status", "done")
    .order("language");

  const languages: LanguageVersion[] = (siblings ?? []).sort((a, b) =>
    a.language === "en" ? -1 : b.language === "en" ? 1 : 0,
  );

  return { transcript, languages };
});
