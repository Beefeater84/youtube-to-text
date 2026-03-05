import type { Metadata } from "next";
import Link from "next/link";
import { SignInButton } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign In — YouTube to Text",
  description: "Sign in with Google to transcribe YouTube videos into readable text.",
};

/**
 * Login page with a single "Sign in with Google" button.
 * Redirects authenticated users to /dashboard via middleware.
 */
export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[80vh] max-w-[960px] items-center justify-center px-4">
      <div className="w-full max-w-[400px] border-3 border-ink bg-surface px-8 py-10 text-center">
        <h1 className="font-headline text-[clamp(1.5rem,4vw,2.2rem)] font-bold leading-tight">
          Sign In
        </h1>

        <p className="mt-3 font-body text-[0.9rem] leading-relaxed text-ink-muted">
          Sign in to transcribe YouTube videos into readable, structured text.
        </p>

        <div className="mt-8">
          <SignInButton className="w-full" />
        </div>

        <p className="mt-6 font-label text-[0.7rem] uppercase tracking-[0.1em] text-ink-faint">
          <Link
            href="/"
            className="cursor-pointer transition-colors duration-150 hover:text-ink"
          >
            Read transcripts without signing in
          </Link>
        </p>
      </div>
    </section>
  );
}
