"use server";

import { createClient } from "@/libs/supabase/server";

interface SubmitResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: validates the user, checks for duplicates, and inserts
 * one transcript record per requested language with status "pending".
 * The worker handles YouTube metadata extraction (title, channel, thumbnail).
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

    const { data: existing } = await supabase
      .from("transcripts")
      .select("language")
      .eq("youtube_video_id", videoId)
      .in("language", languages);

    const existingLangs = new Set(
      (existing ?? []).map((row) => row.language as string),
    );
    const newLangs = languages.filter((lang) => !existingLangs.has(lang));

    if (newLangs.length === 0) {
      return {
        success: false,
        error: "This video has already been submitted for the selected languages.",
      };
    }

    const rows = newLangs.map((lang) => ({
      youtube_video_id: videoId,
      title: videoId,
      slug: lang === "en" ? videoId : `${videoId}-${lang}`,
      status: "pending" as const,
      language: lang,
      user_id: user.id,
    }));

    const { error } = await supabase.from("transcripts").insert(rows);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
