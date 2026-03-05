"use client";

import Link from "next/link";
import { UserMenu } from "@/features/auth";

interface HeaderAuthProps {
  user: { displayName: string | null; avatarUrl: string | null } | null;
}

/**
 * Client component that renders Sign In link or UserMenu in the header.
 * Receives serialized user data from the server-side Header component.
 */
export function HeaderAuth({ user }: HeaderAuthProps) {
  if (!user) {
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
    <UserMenu displayName={user.displayName} avatarUrl={user.avatarUrl} />
  );
}
