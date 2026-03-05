"use server";

import { createClient } from "@/libs/supabase/server";

interface OEmbedResponse {
  title: string;
  author_name: string;
  thumbnail_url: string;
}

interface SubmitResult {
  success: boolean;
  error?: string;
}

/**
 * Fetches video metadata from YouTube oEmbed API.
 * Used by submitTranscriptJob to populate title, channel name, and thumbnail
 * before inserting the transcript record.
 */
async function fetchVideoMetadata(
  videoId: string,
): Promise<OEmbedResponse | null> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return (await res.json()) as OEmbedResponse;
  } catch {
    return null;
  }
}

/**
 * Generates a URL-safe slug from a title string.
 * Used to create readable transcript page URLs like /transcripts/my-video-title.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Finds an existing channel by youtube author name or creates a new one.
 * Used during transcript job submission to link the transcript to its channel.
 */
async function findOrCreateChannel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authorName: string,
  thumbnailUrl: string | null,
) {
  const slug = slugify(authorName);

  const { data: existing } = await supabase
    .from("channels")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("channels")
    .insert({
      youtube_id: slug,
      title: authorName,
      slug,
      thumbnail_url: thumbnailUrl,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create channel: ${error.message}`);
  return created.id as string;
}

/**
 * Server Action: validates the user, fetches YouTube metadata via oEmbed,
 * finds or creates the channel, and inserts a transcript record with status "pending".
 * Called from CreateTranscriptForm on the /dashboard page.
 */
export async function submitTranscriptJob(
  videoId: string,
  languages: string[],
): Promise<SubmitResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "You must be signed in." };
    }

    const { data: existingTranscript } = await supabase
      .from("transcripts")
      .select("id")
      .eq("youtube_video_id", videoId)
      .single();

    if (existingTranscript) {
      return {
        success: false,
        error: "This video has already been submitted.",
      };
    }

    const metadata = await fetchVideoMetadata(videoId);
    if (!metadata) {
      return {
        success: false,
        error: "Could not fetch video info. Check the URL and try again.",
      };
    }

    const channelId = await findOrCreateChannel(
      supabase,
      metadata.author_name,
      null,
    );

    const slug = `${slugify(metadata.title)}-${videoId}`;

    const { error } = await supabase.from("transcripts").insert({
      youtube_video_id: videoId,
      title: metadata.title,
      thumbnail_url: metadata.thumbnail_url,
      slug,
      status: "pending",
      language: "en",
      user_id: user.id,
      channel_id: channelId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
