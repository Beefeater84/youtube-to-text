"use client";

import { buildEmbedUrl } from "@/shared/lib";
import { useCallback } from "react";
import { useVideoPlayer } from "../model/VideoPlayerContext";

interface VideoPlayerProps {
  videoId: string;
}

export function VideoPlayer({ videoId }: VideoPlayerProps) {
  const { registerPlayer } = useVideoPlayer();

  const iframeCallbackRef = useCallback(
    (el: HTMLIFrameElement | null) => {
      if (el) registerPlayer(el);
    },
    [registerPlayer],
  );

  return (
    <div className="relative w-full overflow-hidden bg-ink" style={{ paddingBottom: "56.25%" }}>
      <iframe
        ref={iframeCallbackRef}
        src={buildEmbedUrl(videoId)}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
