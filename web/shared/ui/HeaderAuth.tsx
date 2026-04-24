"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/libs/supabase/client";
import { UserMenu } from "@/features/auth";

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; displayName: string | null; avatarUrl: string | null };

export function HeaderAuth() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setAuth({ status: "anonymous" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();
      setAuth({
        status: "authenticated",
        displayName: profile?.display_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      });
    });
  }, []);

  if (auth.status === "loading") return <span className="w-16" />;

  if (auth.status === "anonymous") {
    return (
      <Link
        href="/login"
        className="cursor-pointer border border-ink px-2.5 py-0.5 font-label text-[0.65rem] uppercase tracking-[0.1em] transition-[background-color,color] duration-150 hover:bg-ink hover:text-paper"
      >
        Sign In
      </Link>
    );
  }

  return (
    <UserMenu displayName={auth.displayName} avatarUrl={auth.avatarUrl} />
  );
}
