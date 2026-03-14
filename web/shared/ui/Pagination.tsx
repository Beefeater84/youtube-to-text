import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

/**
 * URL-based pagination using searchParams (?page=N).
 * Works with SSR/ISR — no client state needed.
 * Used on the homepage and any future paginated listing.
 */
export function Pagination({
  currentPage,
  totalPages,
  basePath = "/",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  function buildHref(page: number): string {
    if (page === 1) return basePath;
    const separator = basePath.includes("?") ? "&" : "?";
    return `${basePath}${separator}page=${page}`;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 pt-6"
    >
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="border border-ink/30 px-3 py-1.5 font-label text-[0.7rem] uppercase tracking-wider transition-colors hover:bg-ink hover:text-paper"
        >
          Prev
        </Link>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="px-1 font-label text-[0.7rem] text-ink-faint"
          >
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p as number)}
            className={`border px-3 py-1.5 font-label text-[0.7rem] uppercase tracking-wider transition-colors ${
              p === currentPage
                ? "border-ink bg-ink text-paper"
                : "border-ink/30 hover:bg-ink hover:text-paper"
            }`}
          >
            {p}
          </Link>
        ),
      )}

      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="border border-ink/30 px-3 py-1.5 font-label text-[0.7rem] uppercase tracking-wider transition-colors hover:bg-ink hover:text-paper"
        >
          Next
        </Link>
      )}
    </nav>
  );
}

function getPageNumbers(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}
