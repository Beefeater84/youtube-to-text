"use client";

import { TimestampBadge } from "@/features/video-player";
import { generateHeadingId } from "@/shared/lib";
import type { TranscriptSection } from "@/shared/lib";
import { useEffect, useState } from "react";

interface TableOfContentsProps {
  sections: TranscriptSection[];
  videoId: string;
}

export function TableOfContents({ sections, videoId }: TableOfContentsProps) {
  const activeId = useActiveHeading("transcript-content");

  return (
    <nav aria-label="Table of contents">
      <h2 className="font-headline text-[0.95rem] uppercase tracking-[0.12em]">
        Sections
      </h2>
      <ul className="mt-2 space-y-1">
        {sections.map((section) => {
          const headingId = generateHeadingId(section.title);
          const isActive = activeId === headingId;

          return (
            <li key={headingId}>
              <a
                href={`#${headingId}`}
                aria-current={isActive ? "location" : undefined}
                className={`flex items-baseline gap-3 border-l-2 py-1.5 pl-3 transition-colors duration-150 ${
                  isActive
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-ghost hover:border-rule hover:text-ink"
                }`}
              >
                <TimestampBadge
                  seconds={section.timestamp}
                  videoId={videoId}
                />
                <span className="font-body text-[0.85rem]">
                  {section.title}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function useActiveHeading(contentId: string): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const root = document.getElementById(contentId);
    if (!root) return;

    const headings = Array.from(root.querySelectorAll("h2[id], h3[id]"));
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [contentId]);

  return activeId;
}
