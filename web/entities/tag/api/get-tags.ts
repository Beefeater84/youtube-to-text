import { createStaticClient } from "@/libs/supabase";
import type { Tag } from "../model/types";

/**
 * Fetches tags for the homepage sidebar "Browse by Topic" section.
 * Returns first N tags ordered by name.
 */
export async function getTopTags(limit: number = 5): Promise<Tag[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug")
    .order("name")
    .limit(limit);

  if (error || !data) return [];
  return data as Tag[];
}
