"use client";

import { createClient } from "@/libs/supabase/client";

/**
 * Button that initiates Google OAuth sign-in flow.
 * Used on the /login page and in the auth CTA widget on transcript pages.
 */
export function SignInButton({ className }: { className?: string }) {
  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={handleSignIn}
      className={`cursor-pointer border-2 border-ink bg-ink px-6 py-3 font-body text-[0.9rem] font-bold text-paper transition-[background-color,color] duration-150 hover:bg-paper hover:text-ink ${className ?? ""}`}
    >
      Sign in with Google
    </button>
  );
}
