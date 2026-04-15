import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { getBaseUrl } from "@/shared/lib";

/**
 * Handles the OAuth callback from Supabase/Google.
 * Exchanges the authorization code for a session, then redirects to /dashboard.
 */
export async function GET(request: Request) {
  const now = new Date().toISOString();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const baseUrl = getBaseUrl();

  console.log(`\n!!! [${now}] AUTH CALLBACK START !!!`);
  console.log(`!!! [${now}] Incoming Request URL: ${request.url}`);
  console.log(`!!! [${now}] Computed Base URL: ${baseUrl}`);
  console.log(`!!! [${now}] Next path: ${next}`);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const finalRedirect = `${baseUrl}${next}`;
      console.log(`!!! [${now}] SUCCESS! Redirecting to: ${finalRedirect}`);
      return NextResponse.redirect(finalRedirect);
    }
    console.error(`!!! [${now}] AUTH ERROR session exchange:`, error);
  } else {
    console.warn(`!!! [${now}] NO CODE found in searchParams`);
  }

  const errorRedirect = `${baseUrl}/login?error=auth`;
  console.log(`!!! [${now}] REDIRECTING TO ERROR: ${errorRedirect}`);
  return NextResponse.redirect(errorRedirect);
}
