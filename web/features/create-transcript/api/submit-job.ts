"use server";

import { createClient } from "@/libs/supabase/server";

interface SubmitResult {
  success: boolean;
  error?: string;
}

const ACTIVE_STATUSES = ["done", "processing", "queued", "waiting_dependency"];

/**
 * Server Action: validates the user, checks for duplicates, re-queues
 * stale records, and inserts new transcript records per requested language.
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
      .select("id, language, status")
      .eq("youtube_video_id", videoId)
      .in("language", languages);

    const existingRecords = existing ?? [];
    const existingLangs = new Set(
      existingRecords.map((row) => row.language as string),
    );

    const staleRecords = existingRecords.filter(
      (row) => !ACTIVE_STATUSES.includes(row.status as string),
    );

    if (staleRecords.length > 0) {
      const staleIds = staleRecords.map((row) => row.id as string);
      await supabase
        .from("transcripts")
        .update({ status: "pending" })
        .eq("youtube_video_id", videoId)
        .in("id", staleIds);
    }

    const newLangs = languages.filter((lang) => !existingLangs.has(lang));

    if (newLangs.length > 0) {
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
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
