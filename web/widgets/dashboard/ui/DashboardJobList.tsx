import Link from "next/link";
import type { Transcript } from "@/entities/transcript";
import { StatusBadge } from "./StatusBadge";

interface DashboardJobListProps {
  transcripts: Transcript[];
}

/**
 * Grid of transcript job cards for the dashboard.
 * Shows status badge, title, video ID, and creation date for each job.
 */
export function DashboardJobList({ transcripts }: DashboardJobListProps) {
  if (transcripts.length === 0) {
    return (
      <div className="border-2 border-dashed border-ink/30 px-6 py-12 text-center">
        <p className="font-headline text-[1.1rem] font-semibold">
          No transcripts yet
        </p>
        <p className="mt-2 font-body text-[0.85rem] text-ink-muted">
          Submit a YouTube URL above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {transcripts.map((transcript) => {
        const isDone = transcript.status === "done";
        const cardClassName = `block border-[1.5px] border-ink bg-paper px-4 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.04)] transition-shadow duration-150 ${
          isDone ? "cursor-pointer hover:shadow-[2px_2px_0_#0a0a0a]" : ""
        }`;

        const content = (
          <>
            <div className="mb-2 flex items-start justify-between gap-2">
              <StatusBadge status={transcript.status} />
              <span className="font-label text-[0.6rem] uppercase tracking-[0.1em] text-ink-ghost">
                {new Date(transcript.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <h3 className="font-headline text-[0.95rem] font-semibold leading-snug">
              {transcript.title}
            </h3>

            <p className="mt-1 font-label text-[0.65rem] uppercase tracking-[0.08em] text-ink-ghost">
              {transcript.youtube_video_id} · {transcript.language}
            </p>
          </>
        );

        if (isDone) {
          return (
            <Link
              key={transcript.id}
              href={`/transcripts/${transcript.slug}`}
              className={cardClassName}
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={transcript.id} className={cardClassName}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
