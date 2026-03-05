import Link from "next/link";
import { createClient } from "@/libs/supabase/server";
import { HeaderAuth } from "./HeaderAuth";

/**
 * Site-wide header with masthead and auth controls.
 * Server component that checks auth state and passes it to the client-side HeaderAuth.
 */
export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { display_name: string | null; avatar_url: string | null } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="mx-auto max-w-[960px] px-4 md:px-6">
      <div className="flex flex-wrap items-center justify-center gap-1 py-1.5 font-label text-[0.7rem] uppercase tracking-[0.12em] text-ink-muted md:justify-between">
        <span>VOL. I · No. 1</span>
        <div className="flex items-center gap-4">
          <span>ESTABLISHED 2026</span>
          <HeaderAuth
            user={user ? { displayName: profile?.display_name ?? null, avatarUrl: profile?.avatar_url ?? null } : null}
          />
        </div>
      </div>

      <hr className="rule-double" />

      <div className="py-5 text-center">
        <Link href="/">
          <h1 className="font-masthead text-[clamp(2.4rem,8vw,5.5rem)] font-normal leading-none tracking-[0.02em]">
            YouTube to Text
          </h1>
        </Link>
        <p className="mt-2 font-headline text-[clamp(0.75rem,2vw,1rem)] font-semibold uppercase tracking-[0.35em] text-ink-muted">
          THE DAILY TRANSCRIPT
        </p>
      </div>

      <hr className="rule-double" />

      <div className="flex flex-col items-center gap-0.5 py-1.5 font-label text-[0.65rem] uppercase tracking-[0.1em] text-ink-light md:flex-row md:justify-between">
        <span>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }).toUpperCase()}
        </span>
        <span className="font-headline text-[0.75rem] italic tracking-[0.05em]">
          ALL THE TRANSCRIPTS FIT TO READ
        </span>
      </div>

      <hr className="rule-thin" />
    </header>
  );
}
