import Link from 'next/link';
import { HorizontalRule } from './horizontal-rule';
import type { Tag, ChannelWithTags } from '@/lib/types';

interface BrowseSectionProps {
  tags: Tag[];
  channels: ChannelWithTags[];
}

export function BrowseSection({ tags, channels }: BrowseSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 py-6">
      {/* Tags column */}
      <div>
        <h3 className="font-body font-bold text-[0.95rem] uppercase tracking-wide mb-2">
          Browse by Topic
        </h3>
        <HorizontalRule variant="thin" />
        <ul className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={`/tags/${tag.slug}`}
                className="inline-block font-body text-[0.8rem] leading-none px-3 py-1.5 border-2 border-ink cursor-pointer transition-colors duration-150 hover:bg-ink hover:text-paper"
              >
                {tag.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Vertical divider (desktop) / horizontal (mobile) */}
      <div
        className="w-full h-0.5 bg-ink my-5 md:w-0.5 md:h-auto md:mx-7 md:my-0"
        aria-hidden="true"
      />

      {/* Channels column */}
      <div>
        <h3 className="font-body font-bold text-[0.95rem] uppercase tracking-wide mb-2">
          Browse by Channel
        </h3>
        <HorizontalRule variant="thin" />
        <ul className="mt-4">
          {channels.map((ch) => (
            <li key={ch.id}>
              <Link
                href={`/channels/${ch.slug}`}
                className="flex justify-between items-baseline py-2 border-b border-dashed border-divider last:border-b-0 cursor-pointer transition-colors duration-150 hover:bg-ink/5 hover:px-1.5 hover:-mx-1.5"
              >
                <span className="font-body font-bold text-[0.9rem]">
                  {ch.title}
                </span>
                <span className="font-meta text-[0.65rem] text-muted-light whitespace-nowrap shrink-0">
                  {ch.tags.map((t) => t.name).join(' · ')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
