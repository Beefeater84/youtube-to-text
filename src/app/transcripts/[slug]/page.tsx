import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranscriptBySlug, getAllTranscriptSlugs } from '@/lib/data/transcripts';
import { fetchMarkdownContent } from '@/lib/markdown';
import { formatDate, formatDuration, siteUrl } from '@/lib/format';
import { MarkdownContent } from '@/components/markdown-content';
import { HorizontalRule } from '@/components/horizontal-rule';

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAllTranscriptSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const transcript = await getTranscriptBySlug(slug);
  if (!transcript) return { title: 'Not Found' };

  const title = transcript.title;
  const description =
    transcript.description ??
    `Read the transcript of "${transcript.title}"`;

  return {
    title,
    description,
    alternates: { canonical: siteUrl(`/transcripts/${slug}`) },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: transcript.published_at ?? undefined,
      images: transcript.thumbnail_url
        ? [{ url: transcript.thumbnail_url }]
        : undefined,
    },
  };
}

export default async function TranscriptPage({ params }: Props) {
  const { slug } = await params;
  const transcript = await getTranscriptBySlug(slug);
  if (!transcript) notFound();

  const channel = transcript.channels;
  const markdown = await fetchMarkdownContent(transcript.markdown_url);

  const youtubeUrl = `https://www.youtube.com/watch?v=${transcript.youtube_video_id}`;

  return (
    <article>
      {/* Meta line */}
      <div className="flex flex-wrap gap-x-3 font-meta text-xs tracking-wide text-muted mb-3">
        <Link
          href={`/channels/${channel.slug}`}
          className="underline underline-offset-2 hover:opacity-60 transition-opacity duration-150"
        >
          {channel.title}
        </Link>
        {transcript.duration_seconds && (
          <span>{formatDuration(transcript.duration_seconds)}</span>
        )}
        <span className="uppercase">{transcript.language}</span>
        {transcript.published_at && (
          <time>{formatDate(transcript.published_at)}</time>
        )}
      </div>

      {/* Title */}
      <h1 className="font-headline font-bold text-[clamp(1.8rem,4vw,3rem)] leading-tight mb-2">
        {transcript.title}
      </h1>

      <HorizontalRule variant="double" />

      {/* Watch link */}
      <div className="my-4">
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border-2 border-ink bg-ink text-paper px-5 py-2 font-meta text-sm tracking-wide cursor-pointer hover:bg-paper hover:text-ink transition-colors duration-150"
        >
          Watch on YouTube
        </a>
      </div>

      <HorizontalRule variant="thin" />

      {/* Content */}
      {markdown ? (
        <div className="mt-6">
          <MarkdownContent content={markdown} />
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="font-headline text-xl font-bold mb-2">
            Transcript Not Available
          </p>
          <p className="font-meta text-sm text-muted">
            The content for this transcript has not been loaded yet.
          </p>
        </div>
      )}

      <HorizontalRule variant="double" />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: transcript.title,
            description: transcript.description,
            datePublished: transcript.published_at,
            dateModified: transcript.updated_at,
            image: transcript.thumbnail_url,
            author: {
              '@type': 'Organization',
              name: channel.title,
              url: siteUrl(`/channels/${channel.slug}`),
            },
            publisher: {
              '@type': 'Organization',
              name: 'YouTube to Text',
              url: siteUrl(),
            },
            mainEntityOfPage: siteUrl(`/transcripts/${transcript.slug}`),
          }),
        }}
      />
    </article>
  );
}
