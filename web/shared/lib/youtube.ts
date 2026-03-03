export function buildEmbedUrl(
  videoId: string,
  options?: { autoplay?: boolean; start?: number },
): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
    origin: typeof window !== "undefined" ? window.location.origin : "",
  });

  if (options?.autoplay) params.set("autoplay", "1");
  if (options?.start) params.set("start", String(options.start));

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function buildWatchUrl(videoId: string, seconds?: number): string {
  const base = `https://www.youtube.com/watch?v=${videoId}`;
  if (seconds && seconds > 0) return `${base}&t=${seconds}s`;
  return base;
}
