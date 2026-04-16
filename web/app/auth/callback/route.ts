import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { getBaseUrl } from "@/shared/lib";

/**
 * Handles the OAuth callback from Supabase/Google.
 * Exchanges the authorization code for a session, then redirects to /dashboard.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const baseUrl = getBaseUrl();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
    console.error("AUTH ERROR session exchange:", error);
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth`);
}
