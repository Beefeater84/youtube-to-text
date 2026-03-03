import matter from "gray-matter";

export interface TranscriptSection {
  title: string;
  timestamp: number;
}

export interface TranscriptFrontmatter {
  video_id: string;
  title: string;
  channel: string;
  duration: number;
  language: string;
  sections: TranscriptSection[];
}

export interface ParsedTranscript {
  frontmatter: TranscriptFrontmatter;
  body: string;
}

export function parseTranscript(raw: string): ParsedTranscript {
  const { data, content } = matter(raw);
  return {
    frontmatter: data as TranscriptFrontmatter,
    body: content,
  };
}

const TIMESTAMP_COMMENT_RE = /<!--\s*t:(\d+)\s*-->/;

export function extractTimestampFromLine(line: string): number | null {
  const match = line.match(TIMESTAMP_COMMENT_RE);
  return match ? parseInt(match[1], 10) : null;
}

export function buildTimestampMap(body: string): Map<string, number> {
  const map = new Map<string, number>();
  const lines = body.split("\n");
  let pendingTimestamp: number | null = null;

  for (const line of lines) {
    const ts = extractTimestampFromLine(line);
    if (ts !== null) {
      pendingTimestamp = ts;
      continue;
    }

    if (pendingTimestamp !== null && line.startsWith("## ")) {
      const headingText = line.replace(/^##\s+/, "").trim();
      map.set(headingText, pendingTimestamp);
      pendingTimestamp = null;
    }
  }

  return map;
}
