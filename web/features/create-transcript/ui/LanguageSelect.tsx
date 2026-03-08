"use client";

const AVAILABLE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "tr", label: "Türkçe" },
] as const;

interface LanguageSelectProps {
  selected: string[];
  onChange: (languages: string[]) => void;
}

/**
 * Multi-language selector for choosing translation languages.
 * English is selected by default but can be toggled freely;
 * the form layer guarantees EN is always included on submission.
 * Used in the CreateTranscriptForm on the /dashboard page.
 */
export function LanguageSelect({ selected, onChange }: LanguageSelectProps) {
  const toggle = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  return (
    <div>
      <label className="mb-2 block font-label text-[0.7rem] uppercase tracking-[0.1em] text-ink-muted">
        Languages (English is always included)
      </label>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_LANGUAGES.map(({ code, label }) => {
          const isSelected = selected.includes(code);

          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              className={`cursor-pointer border-2 border-ink px-3 py-1.5 font-body text-[0.8rem] leading-none transition-[background-color,color] duration-150 ${
                isSelected
                  ? "bg-ink text-paper"
                  : "bg-transparent text-ink hover:bg-ink hover:text-paper"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
