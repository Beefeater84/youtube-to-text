"use server";

import { createClient } from "@/libs/supabase/server";

interface SubmitResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: validates the user, checks for duplicates, and inserts a
 * minimal transcript record with status "pending". The worker handles all
 * YouTube metadata extraction (title, channel, thumbnail) via yt-dlp.
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

    const { error } = await supabase.from("transcripts").insert({
      youtube_video_id: videoId,
      title: videoId,
      slug: videoId,
      status: "pending",
      language: "en",
      user_id: user.id,
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
