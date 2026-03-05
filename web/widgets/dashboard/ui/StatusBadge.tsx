import type { Transcript } from "@/entities/transcript";

type Status = Transcript["status"];

const STATUS_STYLES: Record<Status, string> = {
  pending: "border-ink text-ink-muted",
  queued: "border-ink text-ink-muted",
  processing: "border-ink text-ink-muted animate-pulse",
  done: "border-ink bg-ink text-paper",
  failed: "border-ink text-ink-muted",
};

const STATUS_LABELS: Record<Status, string> = {
  pending: "Pending",
  queued: "Queued",
  processing: "Processing",
  done: "Done",
  failed: "Failed",
};

/**
 * Visual status badge for transcript jobs on the dashboard.
 * Uses monochrome styling per design system — no color accents.
 */
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block border-2 px-2 py-0.5 font-label text-[0.6rem] uppercase tracking-[0.12em] ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
