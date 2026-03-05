import { YoutubeTranscript } from "youtube-transcript";

export interface RawSegment {
  text: string;
  offset: number;
  duration: number;
}

/**
 * Fetches raw caption segments from YouTube for a given video ID.
 * Uses the youtube-transcript library which scrapes captions without an API key.
 * Throws if no captions are available for the video.
 */
export async function fetchRawTranscript(
  videoId: string,
): Promise<RawSegment[]> {
  const items = await YoutubeTranscript.fetchTranscript(videoId);

  if (!items || items.length === 0) {
    throw new Error(`No captions found for video ${videoId}`);
  }

  return items.map((item) => ({
    text: item.text,
    offset: item.offset / 1000,
    duration: item.duration / 1000,
  }));
}
