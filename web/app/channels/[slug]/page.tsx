import Link from "next/link";
import {
  getChannelBySlug,
  getAllChannelSlugs,
  getChannelVideoGroups,
  getChannelVideoGroupsCount,
} from "@/entities/channel";
import { TranscriptCard } from "@/entities/transcript";
import { Pagination } from "@/shared/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

/** Pre-generates pages for all channels with completed transcripts. */
export async function generateStaticParams() {
  const slugs = await getAllChannelSlugs();
  return slugs.map((slug) => ({ slug }));
}

/** Builds SEO metadata for the channel page. */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const channel = await getChannelBySlug(slug);
  if (!channel) return { title: "Channel Not Found" };

  const description =
    channel.description ??
    `Browse all ${channel.transcript_count} transcripts from ${channel.title}.`;

  return {
    title: `${channel.title} — YouTube to Text`,
    description,
    openGraph: {
      title: channel.title,
      description,
      images: channel.thumbnail_url ? [channel.thumbnail_url] : [],
    },
    alternates: {
      canonical: `/channels/${channel.slug}`,
    },
  };
}

export default async function ChannelPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = 20;

  const channel = await getChannelBySlug(slug);
  if (!channel) notFound();

  const [videoGroups, totalCount] = await Promise.all([
    getChannelVideoGroups(channel.id, currentPage, pageSize),
    getChannelVideoGroupsCount(channel.id),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: channel.title,
    description:
      channel.description ??
      `Transcripts from ${channel.title} YouTube channel.`,
    url: `/channels/${channel.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mx-auto max-w-[960px] px-4 pb-8 pt-4 md:px-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 font-label text-[0.65rem] uppercase tracking-[0.1em] text-ink-ghost"
        >
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
          <span className="mx-1.5">›</span>
          <span className="text-ink-muted">{channel.title}</span>
        </nav>

        {/* Channel header */}
        <header className="mb-6">
          <h1 className="font-headline text-[clamp(1.5rem,4vw,2.4rem)] font-bold leading-tight">
            {channel.title}
          </h1>
          <p className="mt-1 font-label text-[0.7rem] uppercase tracking-[0.1em] text-ink-muted">
            {channel.transcript_count} transcripts
          </p>
          {channel.description && (
            <p className="mt-3 max-w-prose font-body text-[0.95rem] leading-relaxed text-ink-muted">
              {channel.description}
            </p>
          )}
        </header>

        <hr className="rule-thin" />

        {/* Transcripts list */}
        <div className="mt-4 space-y-4">
          {videoGroups.length > 0 ? (
            videoGroups.map((video) => (
              <TranscriptCard key={video.youtube_video_id} video={video} />
            ))
          ) : (
            <p className="py-8 text-center font-body text-ink-muted">
              No transcripts yet.
            </p>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={`/channels/${channel.slug}`}
        />
      </section>
    </>
  );
}
