import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { getBaseUrl } from "@/shared/lib";

/**
 * Handles the OAuth callback from Supabase/Google.
 * Exchanges the authorization code for a session, then redirects to /dashboard.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${getBaseUrl()}${next}`);
    }
  }

  return NextResponse.redirect(`${getBaseUrl()}/login?error=auth`);
}
