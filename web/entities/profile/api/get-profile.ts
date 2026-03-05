import { createClient } from "@/libs/supabase/server";
import type { Profile } from "../model/types";

/**
 * Fetches the profile of the currently authenticated user.
 * Used in server components and route handlers that need user profile data.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data as Profile;
}
