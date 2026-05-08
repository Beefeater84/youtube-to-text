"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function ExtensionCallbackPage() {
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session && window.opener) {
        window.opener.postMessage(
          {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          },
          "*",
        );
      }
      window.close();
    })();
  }, []);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p>Completing sign-in… this window will close automatically.</p>
    </div>
  );
}
