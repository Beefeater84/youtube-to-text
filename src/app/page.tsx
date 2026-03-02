import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedTranscripts } from '@/lib/data/transcripts';
import { getChannels } from '@/lib/data/channels';
import { TranscriptCard } from '@/components/transcript-card';
import { HorizontalRule } from '@/components/horizontal-rule';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'YouTube to Text — Read, Don\u2019t Watch',
};

export default async function HomePage() {
  const [transcripts, channels] = await Promise.all([
    getPublishedTranscripts(20),
    getChannels(),
  ]);

  return (
    <>
      {/* Latest transcripts */}
      <section>
        <h2 className="font-headline font-bold text-[clamp(1.6rem,3.5vw,2.4rem)] mb-1">
          Latest Transcripts
        </h2>
        <HorizontalRule variant="thick" />

        {transcripts.length > 0 ? (
          <div>
            {transcripts.map((t) => (
              <TranscriptCard key={t.id} transcript={t} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="font-headline text-2xl font-bold mb-2">
              The Press Is Warming Up
            </p>
            <p className="font-meta text-sm text-muted">
              No transcripts have been published yet. Check back soon.
            </p>
          </div>
        )}
      </section>

      <HorizontalRule variant="double" />

      {/* Browse by channel */}
      <section className="mt-8">
        <h2 className="font-headline font-bold text-[clamp(1.4rem,3vw,2rem)] mb-1">
          Browse by Channel
        </h2>
        <HorizontalRule variant="thick" />

        {channels.length > 0 ? (
          <ul>
            {channels.map((ch) => (
              <li
                key={ch.id}
                className="flex justify-between items-baseline py-3 border-b border-dashed border-divider last:border-b-0"
              >
                <Link
                  href={`/channels/${ch.slug}`}
                  className="font-body font-bold hover:opacity-60 transition-opacity duration-150"
                >
                  {ch.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center font-meta text-sm text-muted">
            No channels yet.
          </p>
        )}
      </section>
    </>
  );
}
