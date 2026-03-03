const MOCK_TAGS = [
  "Startups",
  "Programming",
  "Mathematics",
  "Design",
  "AI & Machine Learning",
  "Business",
  "Science",
  "Philosophy",
  "History",
  "Finance",
  "Productivity",
  "Psychology",
];

const MOCK_CHANNELS = [
  { name: "Y Combinator", count: 48 },
  { name: "3Blue1Brown", count: 32 },
  { name: "Fireship", count: 91 },
  { name: "Lex Fridman", count: 127 },
  { name: "Veritasium", count: 64 },
  { name: "The Futur", count: 53 },
];

export default function Home() {
  return (
    <section className="mx-auto max-w-[960px] px-4 pb-8 pt-4 md:px-6">
      {/* Top info strip */}
      <div className="flex flex-wrap items-center justify-center gap-1 py-1.5 font-label text-[0.7rem] uppercase tracking-[0.12em] text-ink-muted md:justify-between">
        <span>VOL. I · No. 1</span>
        <span>ESTABLISHED 2026</span>
        <span className="hidden xs:inline">PRICE: FREE</span>
      </div>

      <hr className="rule-double" />

      {/* Masthead */}
      <header className="py-5 text-center">
        <h1 className="font-masthead text-[clamp(2.4rem,8vw,5.5rem)] font-normal leading-none tracking-[0.02em]">
          YouTube to Text
        </h1>
        <p className="mt-2 font-headline text-[clamp(0.75rem,2vw,1rem)] font-semibold uppercase tracking-[0.35em] text-ink-muted">
          THE DAILY TRANSCRIPT
        </p>
      </header>

      <hr className="rule-double" />

      {/* Dateline */}
      <div className="flex flex-col items-center gap-0.5 py-1.5 font-label text-[0.65rem] uppercase tracking-[0.1em] text-ink-light md:flex-row md:justify-between">
        <span>MONDAY, MARCH 2, 2026</span>
        <span className="font-headline text-[0.75rem] italic tracking-[0.05em]">
          ALL THE TRANSCRIPTS FIT TO READ
        </span>
      </div>

      <hr className="rule-thin" />

      {/* Headline + Lead */}
      <div className="max-w-[680px] py-6">
        <h2 className="mb-4 font-headline text-[clamp(1.6rem,5vw,3.2rem)] font-bold leading-[1.1] -tracking-[0.02em]">
          Read, Don&apos;t Watch
        </h2>
        <p className="text-justify text-[1.05rem] leading-[1.7] [hyphens:auto]">
          <span className="float-left pr-2 pt-1 font-headline text-[4.2rem] font-bold leading-[0.8]">
            E
          </span>
          very YouTube video holds knowledge trapped inside minutes of footage.
          Our service extracts transcripts, cleans up errors, structures them
          into readable articles, and delivers them in English or any language
          you choose.
        </p>
      </div>

      <hr className="rule-thin" />

      {/* CTA */}
      <div className="cta-box my-5 border-[3px] border-ink bg-surface p-4">
        <label
          htmlFor="video-url"
          className="mb-2 block font-label text-[0.7rem] uppercase tracking-[0.1em] text-ink-muted"
        >
          PASTE VIDEO URL BELOW
        </label>
        <div className="flex flex-col xs:flex-row">
          <input
            type="url"
            id="video-url"
            placeholder="https://youtu.be/..."
            autoComplete="off"
            className="flex-1 border-2 border-b-0 border-ink bg-paper px-3 py-2.5 font-label text-[0.85rem] text-ink outline-none placeholder:text-placeholder focus:bg-surface focus:shadow-[inset_0_0_0_1px_var(--color-ink)] xs:border-b-2 xs:border-r-0"
          />
          <button
            type="button"
            className="cursor-pointer border-2 border-t-0 border-ink bg-ink px-5 py-2.5 font-headline text-[0.85rem] font-bold uppercase tracking-[0.1em] text-paper transition-[background-color,color] duration-150 hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink xs:border-t-2"
          >
            TRANSCRIBE
          </button>
        </div>
      </div>

      <hr className="rule-thick" />

      {/* Browse: Tags + Channels */}
      <div className="grid grid-cols-1 py-6 md:grid-cols-[1fr_auto_1fr]">
        {/* Tags */}
        <div>
          <h3 className="mb-2 font-body text-[0.95rem] font-bold uppercase tracking-[0.06em]">
            Browse by Topic
          </h3>
          <hr className="rule-thin mb-4" />
          <ul className="flex flex-wrap gap-2">
            {MOCK_TAGS.map((tag) => (
              <li key={tag}>
                <a
                  href="#"
                  className="inline-block cursor-pointer border-2 border-ink bg-transparent px-3 py-1.5 font-body text-[0.8rem] leading-none transition-[background-color,color] duration-150 hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {tag}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div
          className="my-5 h-0.5 w-full bg-ink md:mx-7 md:my-0 md:h-auto md:w-0.5"
          aria-hidden="true"
        />

        {/* Channels */}
        <div>
          <h3 className="mb-2 font-body text-[0.95rem] font-bold uppercase tracking-[0.06em]">
            Browse by Channel
          </h3>
          <hr className="rule-thin mb-4" />
          <ul>
            {MOCK_CHANNELS.map((ch, i) => (
              <li key={ch.name}>
                <a
                  href="#"
                  className={`flex cursor-pointer items-baseline justify-between px-0 py-2 transition-[background-color,padding,margin] duration-150 hover:-mx-1.5 hover:bg-ink/5 hover:px-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink${
                    i < MOCK_CHANNELS.length - 1
                      ? " border-b border-dashed border-rule"
                      : ""
                  }`}
                >
                  <span className="font-body text-[0.9rem] font-bold">
                    {ch.name}
                  </span>
                  <span className="shrink-0 font-label text-[0.65rem] text-ink-ghost">
                    {ch.count} transcripts
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <hr className="rule-thick" />

      {/* Bottom strip */}
      <div className="pt-2.5 text-center font-label text-[0.65rem] uppercase tracking-[0.15em] text-ink-faint">
        FREE TO READ · OPEN TO ALL · NO ADS
      </div>
    </section>
  );
}
