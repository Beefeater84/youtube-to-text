import { z } from "zod";
import type { RawSegment, VideoMetadata } from "@/shared/types";

// ── json3 schema ─────────────────────────────────────────────────────────────

const Json3EventSchema = z.object({
  tStartMs: z.number(),
  dDurationMs: z.number().optional(),
  segs: z
    .array(z.object({ utf8: z.string().optional() }))
    .optional(),
});

const Json3Schema = z.object({
  events: z.array(Json3EventSchema),
});

// ── ytInitialPlayerResponse types ────────────────────────────────────────────

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
  name?: { simpleText?: string };
  vssId?: string;
}

interface PlayerResponse {
  videoDetails?: {
    videoId?: string;
    title?: string;
    author?: string;
    channelId?: string;
    lengthSeconds?: string;
    thumbnail?: { thumbnails?: { url: string }[] };
    shortDescription?: string;
  };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
}

// ── helpers ───────────────────────────────────────────────────────────────────

function readPlayerResponse(): PlayerResponse | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (window as unknown as Record<string, unknown>)["ytInitialPlayerResponse"];
  if (!raw || typeof raw !== "object") return null;
  return raw as PlayerResponse;
}

function pickCaptionTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;

  // Prefer non-auto-generated English
  const manualEn = tracks.find(
    (t) => t.languageCode === "en" && t.kind !== "asr",
  );
  if (manualEn) return manualEn;

  // Auto-generated English
  const autoEn = tracks.find((t) => t.languageCode === "en");
  if (autoEn) return autoEn;

  // Non-auto-generated in any language
  const manualAny = tracks.find((t) => t.kind !== "asr");
  if (manualAny) return manualAny;

  return tracks[0];
}

function parseJson3(raw: unknown): RawSegment[] {
  const parsed = Json3Schema.parse(raw);
  const segments: RawSegment[] = [];

  for (const ev of parsed.events) {
    if (!ev.segs) continue;
    const text = ev.segs
      .map((s) => s.utf8 ?? "")
      .join("")
      .replace(/\n/g, " ")
      .trim();
    if (!text) continue;
    segments.push({
      text,
      offset: ev.tStartMs / 1000,
      duration: (ev.dDurationMs ?? 0) / 1000,
    });
  }

  return segments;
}

// ── public API ────────────────────────────────────────────────────────────────

export interface CaptionFetchResult {
  segments: RawSegment[];
  source_language: string;
  metadata: VideoMetadata;
}

export async function fetchCaptionsFromPage(): Promise<CaptionFetchResult> {
  const pr = readPlayerResponse();
  if (!pr) throw new Error("ytInitialPlayerResponse not found");

  const vd = pr.videoDetails;
  if (!vd) throw new Error("videoDetails missing");

  const tracks =
    pr.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  if (tracks.length === 0) throw new Error("no captions available");

  const track = pickCaptionTrack(tracks);
  if (!track) throw new Error("no suitable caption track");

  const url = `${track.baseUrl}&fmt=json3`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Caption fetch failed: HTTP ${res.status}`);

  const json: unknown = await res.json();
  const segments = parseJson3(json);
  if (segments.length === 0) throw new Error("caption track is empty");

  const thumbnails = vd.thumbnail?.thumbnails ?? [];
  const thumbnail_url = thumbnails[thumbnails.length - 1]?.url ?? "";

  const metadata: VideoMetadata = {
    title: vd.title ?? "",
    channel_name: vd.author ?? "",
    channel_id: vd.channelId ?? "",
    duration: parseInt(vd.lengthSeconds ?? "0", 10),
    thumbnail_url,
    description: vd.shortDescription ?? "",
  };

  return {
    segments,
    source_language: track.languageCode,
    metadata,
  };
}

export function isLiveStream(): boolean {
  const pr = readPlayerResponse();
  if (!pr) return false;
  const details = pr.videoDetails as Record<string, unknown> | undefined;
  return details?.["isLive"] === true || details?.["isLiveContent"] === true;
}
