import Link from "next/link";
import type { VideoGroup } from "../model/types";

/**
 * Displays a single video group as a newspaper-style card.
 * Shows channel name, title, and language badges.
 * Used on the homepage transcript list and potentially on channel pages.
 */
export function TranscriptCard({ video }: { video: VideoGroup }) {
  return (
    <article className="border-[1.5px] border-ink bg-paper px-4 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
      <header className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        {video.channel_title && video.channel_slug ? (
          <Link
            href={`/channels/${video.channel_slug}`}
            className="font-label text-[0.7rem] uppercase tracking-[0.12em] text-ink-muted transition-colors hover:text-ink"
          >
            {video.channel_title}
          </Link>
        ) : (
          <span className="font-label text-[0.7rem] uppercase tracking-[0.12em] text-ink-muted">
            Unknown channel
          </span>
        )}
        <div className="flex gap-1">
          {video.languages.map(({ language, slug }) => (
            <Link
              key={language}
              href={`/transcripts/${slug}`}
              className="inline-flex h-5 items-center border border-ink/30 px-1.5 font-label text-[0.6rem] uppercase tracking-wider text-ink-muted transition-colors hover:bg-ink hover:text-paper"
            >
              {language}
            </Link>
          ))}
        </div>
      </header>
      <h3 className="font-headline text-[1rem] font-semibold leading-snug -tracking-[0.01em]">
        <Link
          href={`/transcripts/${video.slug}`}
          className="decoration-1 underline-offset-2 hover:underline"
        >
          {video.title}
        </Link>
      </h3>
      <p className="mt-1 font-label text-[0.65rem] uppercase tracking-[0.08em] text-ink-faint">
        {formatDate(video.created_at)}
      </p>
    </article>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
