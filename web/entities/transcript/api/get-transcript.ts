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
