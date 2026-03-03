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

      {/* Main content with sidebar */}
      <div className="grid gap-8 py-6 md:grid-cols-[minmax(0,2.1fr)_minmax(260px,1fr)]">
        {/* Latest news */}
        <section aria-label="Latest transcripts" className="space-y-4">
          <h2 className="font-headline text-[1.1rem] uppercase tracking-[0.12em]">
            Latest News
          </h2>
          <hr className="rule-thin" />
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <article
                key={idx}
                className="border-[1.5px] border-ink bg-paper px-4 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
              >
                <header className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                  <span className="font-label text-[0.7rem] uppercase tracking-[0.12em] text-ink-muted">
                    Lex Fridman
                  </span>
                  <span className="font-label text-[0.7rem] uppercase tracking-[0.12em] text-ink-faint">
                    New transcript
                  </span>
                </header>
                <h3 className="font-headline text-[1rem] font-semibold leading-snug -tracking-[0.01em]">
                  Why Large Language Models Still Surprise Us
                </h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-ink">
                  A deep-dive interview with an AI researcher on the limits,
                  capabilities, and open questions around modern language
                  models, distilled into a crisp, skimmable transcript.
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6" aria-label="Browse transcripts">
          {/* Browse by Channel */}
          <section>
            <h3 className="mb-2 font-body text-[0.95rem] font-bold uppercase tracking-[0.06em]">
              Browse by Channel
            </h3>
            <hr className="rule-thin mb-3" />
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
          </section>

          {/* Browse by Topic */}
          <section>
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
          </section>
        </aside>
      </div>

      <hr className="rule-thick" />

      {/* Bottom strip */}
      <div className="pt-2.5 text-center font-label text-[0.65rem] uppercase tracking-[0.15em] text-ink-faint">
        FREE TO READ · OPEN TO ALL · NO ADS
      </div>
    </section>
  );
}
