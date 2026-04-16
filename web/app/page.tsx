import Link from "next/link";
import {
  getLatestVideoGroups,
  getVideoGroupsTotalCount,
  TranscriptCard,
} from "@/entities/transcript";
import { getTopChannels } from "@/entities/channel";
import { getTopTags } from "@/entities/tag";
import { Pagination } from "@/shared/ui";

export const revalidate = 3600;

interface HomeProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = 20;

  const [videoGroups, totalCount, channels, tags] = await Promise.all([
    getLatestVideoGroups(currentPage, pageSize),
    getVideoGroupsTotalCount(),
    getTopChannels(5),
    getTopTags(5),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <section className="mx-auto max-w-[960px] px-4 pb-8 pt-4 md:px-6">
      <div className="grid gap-8 py-6 md:grid-cols-[minmax(0,2.1fr)_minmax(260px,1fr)]">
        {/* Main content */}
        <section aria-label="Latest transcripts" className="space-y-4">
          <h2 className="font-headline text-[1.1rem] uppercase tracking-[0.12em]">
            Latest News
          </h2>
          <hr className="rule-thin" />
          <div className="space-y-4">
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
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </section>

        {/* Sidebar */}
        <aside className="space-y-6" aria-label="Browse transcripts">
          {/* Browse by Channel */}
          <section>
            <h3 className="mb-2 font-body text-[0.95rem] font-bold uppercase tracking-[0.06em]">
              Browse by Channel
            </h3>
            <hr className="rule-thin mb-3" />
            {channels.length > 0 ? (
              <ul>
                {channels.map((ch, i) => (
                  <li key={ch.id}>
                    <Link
                      href={`/channels/${ch.slug}`}
                      className={`flex cursor-pointer items-baseline justify-between px-0 py-2 transition-[background-color,padding,margin] duration-150 hover:-mx-1.5 hover:bg-ink/5 hover:px-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink${
                        i < channels.length - 1
                          ? " border-b border-dashed border-rule"
                          : ""
                      }`}
                    >
                      <span className="font-body text-[0.9rem] font-bold">
                        {ch.title}
                      </span>
                      <span className="shrink-0 font-label text-[0.65rem] text-ink-ghost">
                        {ch.transcript_count} transcripts
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 font-body text-[0.85rem] text-ink-muted">
                No channels yet.
              </p>
            )}
          </section>

          {/* Browse by Topic */}
          <section>
            <h3 className="mb-2 font-body text-[0.95rem] font-bold uppercase tracking-[0.06em]">
              Browse by Topic
            </h3>
            <hr className="rule-thin mb-4" />
            {tags.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li key={tag.id}>
                    <Link
                      href={`/topics/${tag.slug}`}
                      className="inline-block cursor-pointer border-2 border-ink bg-transparent px-3 py-1.5 font-body text-[0.8rem] leading-none transition-[background-color,color] duration-150 hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      {tag.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 font-body text-[0.85rem] text-ink-muted">
                No topics yet.
              </p>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
