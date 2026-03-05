import { createClient } from "@/libs/supabase/server";
import { AuthCTAContent } from "./AuthCTAContent";

/**
 * Server component that checks auth state before rendering the CTA.
 * Only renders the CTA for non-authenticated users on transcript pages.
 */
export async function AuthCTA() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return null;

  return <AuthCTAContent />;
}
