import Link from 'next/link';
import { formatDuration, formatDate } from '@/lib/format';
import type { TranscriptWithChannel } from '@/lib/types';

export function TranscriptCard({ transcript }: { transcript: TranscriptWithChannel }) {
  const channel = transcript.channels;

  return (
    <article className="py-5 border-b border-dashed border-divider last:border-b-0">
      {/* Meta line */}
      <div className="flex flex-wrap gap-x-3 font-meta text-xs tracking-wide text-muted mb-2">
        <Link
          href={`/channels/${channel.slug}`}
          className="hover:opacity-60 transition-opacity duration-150 underline underline-offset-2"
        >
          {channel.title}
        </Link>
        {transcript.duration_seconds && (
          <span>{formatDuration(transcript.duration_seconds)}</span>
        )}
        <span className="uppercase">{transcript.language}</span>
      </div>

      {/* Headline */}
      <h3 className="font-headline font-bold text-[clamp(1.2rem,2.5vw,1.6rem)] leading-snug mb-2">
        <Link
          href={`/transcripts/${transcript.slug}`}
          className="no-underline hover:opacity-60 transition-opacity duration-150"
        >
          {transcript.title}
        </Link>
      </h3>

      {/* Description */}
      {transcript.description && (
        <p className="text-sm leading-relaxed text-muted-light line-clamp-3">
          {transcript.description}
        </p>
      )}

      {/* Date */}
      {transcript.published_at && (
        <time className="block mt-2 font-meta text-xs text-muted">
          {formatDate(transcript.published_at)}
        </time>
      )}
    </article>
  );
}
