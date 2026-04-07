"use client";

import { Download } from "lucide-react";

interface DownloadTranscriptButtonProps {
  content: string;
  filename: string;
}

/**
 * Client component that triggers a browser download for a string content.
 * Used for downloading transcripts as Markdown files without triggerring browser navigation.
 */
export function DownloadTranscriptButton({
  content,
  filename,
}: DownloadTranscriptButtonProps) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex h-7 items-center gap-2 border-[1.5px] border-ink bg-transparent px-3 font-label text-[0.65rem] uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-paper"
      title={`Download ${filename}`}
    >
      <Download className="h-3 w-3" />
      Download Markdown
    </button>
  );
}
