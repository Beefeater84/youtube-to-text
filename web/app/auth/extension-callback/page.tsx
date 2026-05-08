"use client";

import { useEffect } from "react";

export default function ExtensionCallbackPage() {
  useEffect(() => {
    // Supabase implicit flow puts tokens in the URL hash:
    // #access_token=...&refresh_token=...&expires_at=...
    // Read directly — no Supabase client needed, works regardless of which
    // Supabase project the extension is pointed at.
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const expires_at = Number(params.get("expires_at") ?? "0");

    if (access_token && refresh_token && window.opener) {
      window.opener.postMessage(
        { access_token, refresh_token, expires_at },
        "*",
      );
    }
    window.close();
  }, []);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p>Completing sign-in… this window will close automatically.</p>
    </div>
  );
}
