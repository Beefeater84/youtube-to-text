/**
 * Site-wide footer strip.
 * Used in the root layout below all page content.
 */
export function Footer() {
  return (
    <footer className="mx-auto max-w-[960px] px-4 md:px-6">
      <hr className="rule-thick" />
      <div className="py-2.5 text-center font-label text-[0.65rem] uppercase tracking-[0.15em] text-ink-faint">
        FREE TO READ · OPEN TO ALL · NO ADS
      </div>
    </footer>
  );
}
