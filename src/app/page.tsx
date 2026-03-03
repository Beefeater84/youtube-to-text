import type { Metadata } from 'next';
import { getPublishedTranscripts } from '@/lib/data/transcripts';
import { getChannels } from '@/lib/data/channels';
import { getTags } from '@/lib/data/tags';
import { TranscriptCard } from '@/components/transcript-card';
import { HorizontalRule } from '@/components/horizontal-rule';
import { HeroIntro } from '@/components/hero-intro';
import { HeroCta } from '@/components/hero-cta';
import { BrowseSection } from '@/components/browse-section';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'YouTube to Text — Read, Don\u2019t Watch',
};

export default async function HomePage() {
  const [transcripts, channels, tags] = await Promise.all([
    getPublishedTranscripts(20),
    getChannels(),
    getTags(),
  ]);

  return (
    <>
      {/* Hero: headline + lead */}
      <HeroIntro />

      <HorizontalRule variant="thin" />

      {/* CTA: paste URL */}
      <HeroCta />

      <HorizontalRule variant="thick" />

      {/* Browse: tags + channels */}
      <BrowseSection tags={tags} channels={channels} />

      <HorizontalRule variant="thick" />

      {/* Bottom strip */}
      <p className="text-center font-meta text-[0.65rem] tracking-[0.15em] uppercase text-muted-light py-3">
        Free to read &middot; Open to all &middot; No ads
      </p>

      <HorizontalRule variant="double" />

      {/* Latest transcripts */}
      <section className="mt-8">
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
    </>
  );
}
