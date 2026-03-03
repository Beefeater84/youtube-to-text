"use client";

import { formatTime } from "@/shared/lib";
import { buildWatchUrl } from "@/shared/lib";
import { useVideoPlayer } from "../model/VideoPlayerContext";

interface TimestampBadgeProps {
  seconds: number;
  videoId: string;
}

export function TimestampBadge({ seconds, videoId }: TimestampBadgeProps) {
  const { seekTo } = useVideoPlayer();

  return (
    <a
      href={buildWatchUrl(videoId, seconds)}
      onClick={(e) => {
        e.preventDefault();
        seekTo(seconds);
      }}
      title={`Jump to ${formatTime(seconds)} in video`}
      className="inline-flex items-center gap-1 font-label text-[0.7rem] text-ink-ghost transition-colors duration-150 hover:text-ink"
    >
      <span aria-hidden="true">▸</span>
      <span>{formatTime(seconds)}</span>
    </a>
  );
}
