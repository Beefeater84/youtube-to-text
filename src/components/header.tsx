import Link from 'next/link';
import { HorizontalRule } from './horizontal-rule';

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function Header() {
  return (
    <header className="mb-8">
      {/* Info strip */}
      <div className="flex justify-between font-meta text-xs tracking-widest text-muted py-2">
        <span>VOL. I</span>
        <span>EST. MMXXVI</span>
        <span>FREE</span>
      </div>

      <HorizontalRule variant="double" />

      {/* Masthead */}
      <div className="py-5 text-center">
        <Link href="/" className="no-underline hover:opacity-70 transition-opacity duration-150">
          <h1 className="font-masthead text-[clamp(2.4rem,6vw,4rem)] leading-tight">
            YouTube to Text
          </h1>
        </Link>
      </div>

      <HorizontalRule variant="double" />

      {/* Dateline */}
      <div className="flex justify-between font-meta text-xs tracking-wide text-muted-light py-2">
        <time>{todayFormatted()}</time>
        <span className="italic">Read, don&apos;t watch.</span>
      </div>

      <HorizontalRule variant="thin" />
    </header>
  );
}
