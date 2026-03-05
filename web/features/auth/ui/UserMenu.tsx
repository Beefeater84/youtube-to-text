"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

interface UserMenuProps {
  displayName: string | null;
  avatarUrl: string | null;
}

/**
 * Dropdown menu showing user avatar, name, dashboard link and sign-out.
 * Used in the header when the user is authenticated.
 */
export function UserMenu({ displayName, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = displayName
    ? displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-2 transition-opacity duration-150 hover:opacity-80"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName ?? "User avatar"}
            className="h-7 w-7 border border-ink object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center border border-ink bg-ink font-label text-[0.6rem] text-paper">
            {initials}
          </span>
        )}
        <span className="hidden font-label text-[0.7rem] uppercase tracking-[0.08em] md:inline">
          {displayName ?? "Account"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[160px] border-2 border-ink bg-paper shadow-[2px_2px_0_#0a0a0a]">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block cursor-pointer px-4 py-2.5 font-body text-[0.8rem] transition-colors duration-150 hover:bg-ink hover:text-paper"
          >
            Dashboard
          </Link>
          <hr className="border-ink/20" />
          <div className="px-4 py-2.5">
            <SignOutButton className="w-full text-left" />
          </div>
        </div>
      )}
    </div>
  );
}
