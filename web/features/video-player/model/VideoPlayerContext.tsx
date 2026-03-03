"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";

interface VideoPlayerContextValue {
  seekTo: (seconds: number) => void;
  registerPlayer: (iframe: HTMLIFrameElement) => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextValue | null>(null);

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const registerPlayer = useCallback((iframe: HTMLIFrameElement) => {
    iframeRef.current = iframe;
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: "seekTo",
        args: [seconds, true],
      }),
      "https://www.youtube.com",
    );
  }, []);

  return (
    <VideoPlayerContext.Provider value={{ seekTo, registerPlayer }}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) {
    throw new Error("useVideoPlayer must be used within VideoPlayerProvider");
  }
  return ctx;
}
