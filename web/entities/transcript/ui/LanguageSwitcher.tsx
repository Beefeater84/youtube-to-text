import Link from "next/link";
import type { LanguageVersion } from "../model/types";

interface LanguageSwitcherProps {
  languages: LanguageVersion[];
  currentLanguage: string;
}

/**
 * Renders clickable language badges for all available transcript versions.
 * Highlights the currently active language; others are navigation links.
 * Used in the transcript page header next to video metadata.
 */
export function LanguageSwitcher({
  languages,
  currentLanguage,
}: LanguageSwitcherProps) {
  if (languages.length <= 1) return null;

  const base =
    "inline-flex items-center justify-center h-6 px-2.5 font-label text-[0.65rem] uppercase tracking-[0.1em] border";

  return (
    <nav
      aria-label="Available languages"
      className="flex flex-wrap items-center gap-1.5"
    >
      {languages.map(({ language, slug }) => {
        const isCurrent = language === currentLanguage;

        if (isCurrent) {
          return (
            <span
              key={language}
              className={`${base} border-ink bg-ink text-paper`}
              aria-current="true"
            >
              {language}
            </span>
          );
        }

        return (
          <Link
            key={language}
            href={`/transcripts/${slug}`}
            className={`${base} border-ink/30 text-ink-muted transition-colors hover:bg-ink hover:text-paper`}
          >
            {language}
          </Link>
        );
      })}
    </nav>
  );
}
