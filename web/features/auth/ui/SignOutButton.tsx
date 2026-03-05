"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

/**
 * Button that signs the user out and redirects to the home page.
 * Used inside the UserMenu dropdown in the header.
 */
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className={`cursor-pointer font-body text-[0.8rem] text-ink transition-colors duration-150 hover:text-ink-muted ${className ?? ""}`}
    >
      Sign Out
    </button>
  );
}
