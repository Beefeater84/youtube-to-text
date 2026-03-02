import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getChannelBySlug, getAllChannelSlugs } from '@/lib/data/channels';
import { siteUrl } from '@/lib/format';
import { TranscriptCard } from '@/components/transcript-card';
import { HorizontalRule } from '@/components/horizontal-rule';
import type { TranscriptWithChannel } from '@/lib/types';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAllChannelSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const channel = await getChannelBySlug(slug);
  if (!channel) return { title: 'Not Found' };

  return {
    title: channel.title,
    description:
      channel.description ?? `Browse transcripts from ${channel.title}`,
    alternates: { canonical: siteUrl(`/channels/${slug}`) },
  };
}

export default async function ChannelPage({ params }: Props) {
  const { slug } = await params;
  const channel = await getChannelBySlug(slug);
  if (!channel) notFound();

  const transcriptsWithChannel: TranscriptWithChannel[] =
    channel.transcripts.map((t) => ({
      ...t,
      channels: channel,
    }));

  return (
    <>
      {/* Channel name */}
      <h1 className="font-headline font-bold text-[clamp(1.8rem,4vw,3rem)] leading-tight mb-1">
        {channel.title}
      </h1>

      {channel.description && (
        <p className="text-sm text-muted-light leading-relaxed mb-4">
          {channel.description}
        </p>
      )}

      <HorizontalRule variant="double" />

      {/* Transcript list */}
      <section className="mt-4">
        <h2 className="font-headline font-bold text-[clamp(1.3rem,2.5vw,1.8rem)] mb-1">
          Transcripts
        </h2>
        <HorizontalRule variant="thick" />

        {transcriptsWithChannel.length > 0 ? (
          <div>
            {transcriptsWithChannel.map((t) => (
              <TranscriptCard key={t.id} transcript={t} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="font-headline text-xl font-bold mb-2">
              No Published Transcripts
            </p>
            <p className="font-meta text-sm text-muted">
              This channel has no published transcripts yet.
            </p>
          </div>
        )}
      </section>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: channel.title,
            description: channel.description,
            url: siteUrl(`/channels/${channel.slug}`),
            isPartOf: {
              '@type': 'WebSite',
              name: 'YouTube to Text',
              url: siteUrl(),
            },
          }),
        }}
      />
    </>
  );
}
