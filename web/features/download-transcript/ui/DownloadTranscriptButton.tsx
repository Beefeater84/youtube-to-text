"use client";

import { Download } from "lucide-react";

interface DownloadTranscriptButtonProps {
  content?: string;
  url?: string;
  filename: string;
  variant?: "default" | "icon";
  language?: string;
}

/**
 * Client component that triggers a browser download for a string content or URL.
 * Supports a full button with text or a compact icon-only version.
 */
export function DownloadTranscriptButton({
  content,
  url,
  filename,
  variant = "default",
  language,
}: DownloadTranscriptButtonProps) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let downloadUrl = url;

    if (content) {
      const blob = new Blob([content], { type: "text/markdown" });
      downloadUrl = URL.createObjectURL(blob);
    } else if (url) {
      // If full binary/cross-origin issue, we could fetch here but let's try direct first
      // since we're using this on the ArticleCard where we don't have the full content yet
      // unless we fetch it on click.
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.error("Download failed:", err);
        // Fallback to direct link if fetch fails (CORS)
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.download = filename;
        a.click();
        return;
      }
    }

    if (!downloadUrl) return;

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (content) {
      URL.revokeObjectURL(downloadUrl);
    }
  };

  const tooltip = language
    ? `Download article in ${language === "en" ? "English" : language === "ru" ? "Russian" : language}`
    : `Download ${filename}`;

  if (variant === "icon") {
    return (
      <button
        onClick={handleDownload}
        className="inline-flex h-5 w-5 items-center justify-center border border-ink/30 bg-transparent text-ink-muted transition-colors hover:border-ink hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        title={tooltip}
        aria-label={tooltip}
      >
        <Download className="h-3 w-3" />
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex h-7 items-center gap-2 border-[1.5px] border-ink bg-transparent px-3 font-label text-[0.65rem] uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      title={tooltip}
    >
      <Download className="h-3 w-3" />
      Download Markdown
    </button>
  );
}
