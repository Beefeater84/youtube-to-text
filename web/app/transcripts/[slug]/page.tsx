import {
  fetchTranscriptMarkdown,
  getAllTranscriptSlugs,
  getTranscriptPageData,
  LanguageSwitcher,
} from "@/entities/transcript";
import {
  VideoPlayer,
  VideoPlayerProvider,
} from "@/features/video-player";
import { getBaseUrl, formatTime, parseTranscript } from "@/shared/lib";
import {
  MarkdownContent,
  TableOfContents,
} from "@/widgets/transcript-article";
import { AuthCTA } from "@/widgets/auth-cta";
import { DownloadTranscriptButton } from "@/features/download-transcript";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 86400; // 24h ISR

export async function generateStaticParams() {
  const slugs = await getAllTranscriptSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { transcript, languages } = await getTranscriptPageData(slug);
  if (!transcript) return { title: "Transcript Not Found" };

  const description =
    transcript.description ??
    `Read the full transcript of "${transcript.title}" by ${transcript.channels.title}.`;

  const languageAlternates = Object.fromEntries(
    languages.map((l) => [l.language, `/transcripts/${l.slug}`]),
  );

  return {
    title: `${transcript.title} — YouTube to Text`,
    description,
    openGraph: {
      title: transcript.title,
      description,
      type: "article",
      images: transcript.thumbnail_url ? [transcript.thumbnail_url] : [],
    },
    alternates: {
      canonical: `/transcripts/${transcript.slug}`,
      languages: languageAlternates,
    },
  };
}

export default async function TranscriptPage({ params }: PageProps) {
  const { slug } = await params;
  const { transcript, languages } = await getTranscriptPageData(slug);
  if (!transcript) notFound();

  const markdownUrl = transcript.markdown_url;
  if (!markdownUrl) notFound();

  const baseUrl = getBaseUrl();
  const fullUrl = markdownUrl.startsWith("http")
    ? markdownUrl
    : `${baseUrl}${markdownUrl}`;

  const raw = await fetchTranscriptMarkdown(fullUrl);
  if (!raw) notFound();

  const { frontmatter, body } = parseTranscript(raw);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: transcript.title,
    description: transcript.description,
    image: transcript.thumbnail_url,
    author: {
      "@type": "Person",
      name: transcript.channels.title,
    },
    datePublished: transcript.published_at,
    publisher: {
      "@type": "Organization",
      name: "YouTube to Text",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-[960px] px-4 pb-12 pt-4 md:px-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 font-label text-[0.65rem] uppercase tracking-[0.1em] text-ink-ghost"
        >
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
          <span className="mx-1.5">›</span>
          <Link
            href={`/channels/${transcript.channels.slug}`}
            className="hover:text-ink"
          >
            {transcript.channels.title}
          </Link>
          <span className="mx-1.5">›</span>
          <span className="text-ink-muted">{transcript.title}</span>
        </nav>

        <VideoPlayerProvider>
          {/* Video player */}
          <VideoPlayer videoId={transcript.youtube_video_id} />

          {/* Article header */}
          <header className="mt-6">
            <h1 className="font-headline text-[clamp(1.5rem,4vw,2.4rem)] font-bold leading-tight">
              {transcript.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-label text-[0.7rem] uppercase tracking-[0.1em] text-ink-muted">
              <Link href={`/channels/${transcript.channels.slug}`} className="hover:text-ink">{transcript.channels.title}</Link>
              <span aria-hidden="true">·</span>
              {transcript.duration_seconds && (
                <>
                  <span>{formatTime(transcript.duration_seconds)}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>{frontmatter.language.toUpperCase()}</span>
              {transcript.published_at && (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={transcript.published_at}>
                    {new Date(transcript.published_at).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}
                  </time>
                </>
              )}
            </div>

            {/* Language versions and Download */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <LanguageSwitcher
                languages={languages}
                currentLanguage={transcript.language}
              />
              <DownloadTranscriptButton
                content={raw}
                filename={`${transcript.channels.title} - ${transcript.title} (${transcript.language}).md`}
              />
            </div>
          </header>

          <hr className="rule-double my-6" />

          {/* Table of contents */}
          <TableOfContents
            sections={frontmatter.sections}
            videoId={transcript.youtube_video_id}
          />

          <hr className="rule-thin my-6" />

          {/* Transcript body */}
          <MarkdownContent
            body={body}
            videoId={transcript.youtube_video_id}
          />
        </VideoPlayerProvider>

        <hr className="rule-thin my-8" />

        <AuthCTA />

        <hr className="rule-thick mt-10" />

        <div className="pt-2.5 text-center font-label text-[0.65rem] uppercase tracking-[0.15em] text-ink-faint">
          Transcript · {transcript.channels.title} ·{" "}
          {transcript.youtube_video_id}
        </div>
      </article>
    </>
  );
}
