import { getSupabase } from "../db.js";

/**
 * Uploads a markdown transcript file to Supabase Storage and returns its public URL.
 * Path follows the convention from docs/data-storage.md:
 * {shard}/{videoId}/{lang}.md where shard = first 2 chars of videoId.
 */
export async function uploadToStorage(
  videoId: string,
  language: string,
  markdownContent: string,
): Promise<string> {
  const supabase = getSupabase();
  const shard = videoId.slice(0, 2);
  const path = `${shard}/${videoId}/${language}.md`;

  const { error } = await supabase.storage
    .from("transcripts")
    .upload(path, Buffer.from(markdownContent, "utf-8"), {
      contentType: "text/markdown",
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("transcripts").getPublicUrl(path);

  return publicUrl;
}
