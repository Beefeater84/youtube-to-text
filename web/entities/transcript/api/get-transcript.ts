import { createStaticClient } from "@/libs/supabase";
import type { TranscriptWithChannel } from "../model/types";

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

export async function getAllTranscriptSlugs(): Promise<string[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("transcripts")
    .select("slug")
    .eq("status", "done");

  if (error || !data) return [];
  return data.map((row) => row.slug);
}

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
