"use client";

import { SignInButton } from "@/features/auth";

/**
 * Client-side CTA block encouraging users to sign in.
 * Styled as a classified ad per the newspaper design system.
 */
export function AuthCTAContent() {
  return (
    <aside className="relative border-3 border-ink bg-surface px-6 py-6">
      <div className="mb-1 inline-block border border-ink bg-ink px-2 py-0.5 font-label text-[0.6rem] uppercase tracking-[0.15em] text-paper">
        Classified
      </div>

      <h3 className="mt-3 font-headline text-[1.2rem] font-bold leading-snug">
        Transcribe Your Own Videos
      </h3>

      <p className="mt-2 font-body text-[0.85rem] leading-relaxed text-ink-muted">
        Sign in with Google to convert any YouTube video into readable,
        structured text.
      </p>

      <div className="mt-4">
        <SignInButton />
      </div>
    </aside>
  );
}
