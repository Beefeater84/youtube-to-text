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

  console.log("[AUTH CALLBACK] Incoming Request URL:", request.url);
  console.log("[AUTH CALLBACK] Computed Base URL:", baseUrl);
  console.log("[AUTH CALLBACK] Next path:", next);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const finalRedirect = `${baseUrl}${next}`;
      console.log("[AUTH CALLBACK] Success! Redirecting to:", finalRedirect);
      return NextResponse.redirect(finalRedirect);
    }
    console.error("[AUTH CALLBACK] Auth error session exchange:", error);
  } else {
    console.warn("[AUTH CALLBACK] No code found in searchParams");
  }

  const errorRedirect = `${baseUrl}/login?error=auth`;
  console.log("[AUTH CALLBACK] Redirecting to error:", errorRedirect);
  return NextResponse.redirect(errorRedirect);
}
