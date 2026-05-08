import browser from "webextension-polyfill";
import type { CaptionFetchResult } from "@/lib/youtube/timedtext";
import { submitFetch } from "@/lib/api";
import { getValidAccessToken } from "@/lib/auth";
import type { BgMessage, BgResponse } from "@/shared/types";

browser.runtime.onMessage.addListener(
  (rawMsg: unknown, sender): Promise<BgResponse> => {
    const msg = rawMsg as BgMessage;
    return handleMessage(msg, sender.tab?.id);
  },
);

async function handleMessage(msg: BgMessage, tabId?: number): Promise<BgResponse> {
  if (msg.type === "FETCH_AND_SUBMIT") {
    return fetchAndSubmit(msg.videoId, tabId, msg.jobId);
  }
  return { ok: false, error: "Unknown message type" };
}

async function fetchAndSubmit(
  videoId: string,
  tabId?: number,
  jobId?: string,
): Promise<BgResponse> {
  const token = await getValidAccessToken();
  if (!token) return { ok: false, error: "Not authenticated" };

  if (!tabId) return { ok: false, error: "No active tab" };

  type TabResult =
    | { ok: true; segments: CaptionFetchResult["segments"]; source_language: string; metadata: CaptionFetchResult["metadata"] }
    | { ok: false; error: string };

  let tabResult: TabResult | null = null;

  try {
    const results = await browser.scripting.executeScript({
      target: { tabId },
      func: fetchCaptionsInTab,
      world: "MAIN",
    });
    tabResult = (results[0]?.result ?? null) as TabResult | null;
  } catch (e) {
    return { ok: false, error: `executeScript failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  if (!tabResult) {
    return { ok: false, error: "No result from page — try refreshing the YouTube tab" };
  }
  if (!tabResult.ok) {
    return { ok: false, error: tabResult.error };
  }
  if (tabResult.segments.length === 0) {
    return { ok: false, error: "no captions available" };
  }

  try {
    const response = await submitFetch({
      job_id: jobId,
      video_id: videoId,
      target_language: "en",
      source_language: tabResult.source_language,
      metadata: tabResult.metadata,
      segments: tabResult.segments,
    });
    return { ok: true, jobId: response.job_id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// This function is serialized and injected into the YouTube tab.
// It must be self-contained (no imports, no throws — returns { ok, error } instead).
function fetchCaptionsInTab(): Promise<
  | { ok: true; segments: { text: string; offset: number; duration: number }[]; source_language: string; metadata: { title: string; channel_name: string; channel_id: string; duration: number; thumbnail_url: string; description: string } }
  | { ok: false; error: string }
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pr = (window as any)["ytInitialPlayerResponse"] as Record<string, unknown> | undefined;
  if (!pr) return Promise.resolve({ ok: false, error: "ytInitialPlayerResponse not found — try refreshing the page" });

  if (pr["isLive"] || pr["isLiveContent"]) {
    return Promise.resolve({ ok: false, error: "live stream: captions not available" });
  }

  const vd = pr["videoDetails"] as Record<string, unknown> | undefined;
  if (!vd) return Promise.resolve({ ok: false, error: "videoDetails missing in player response" });

  const captionRenderer = (
    pr["captions"] as Record<string, unknown> | undefined
  )?.["playerCaptionsTracklistRenderer"] as Record<string, unknown> | undefined;
  const tracks = (captionRenderer?.["captionTracks"] as unknown[]) ?? [];

  if (tracks.length === 0) {
    return Promise.resolve({ ok: false, error: "no captions available" });
  }

  function pickTrack(ts: unknown[]): Record<string, unknown> {
    const manualEn = ts.find(
      (t) =>
        (t as Record<string, unknown>)["languageCode"] === "en" &&
        (t as Record<string, unknown>)["kind"] !== "asr",
    );
    if (manualEn) return manualEn as Record<string, unknown>;
    const autoEn = ts.find(
      (t) => (t as Record<string, unknown>)["languageCode"] === "en",
    );
    if (autoEn) return autoEn as Record<string, unknown>;
    const manualAny = ts.find(
      (t) => (t as Record<string, unknown>)["kind"] !== "asr",
    );
    if (manualAny) return manualAny as Record<string, unknown>;
    return ts[0] as Record<string, unknown>;
  }

  const track = pickTrack(tracks);
  const languageCode = track["languageCode"] as string;
  const captionUrl = new URL(track["baseUrl"] as string);
  captionUrl.searchParams.set("fmt", "vtt");

  return fetch(captionUrl.toString())
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} fetching captions`);
      return r.text();
    })
    .then((vtt: string) => {
      const segments: { text: string; offset: number; duration: number }[] = [];
      for (const block of vtt.split(/\n\n+/)) {
        const lines = block.trim().split("\n");
        const timeLine = lines.find((l) => l.includes("-->"));
        if (!timeLine) continue;
        const [rawStart, rawEnd] = timeLine.split("-->").map((s) => {
          const p = s.trim().split(":");
          return p.length === 3
            ? +p[0] * 3600 + +p[1] * 60 + parseFloat(p[2])
            : +p[0] * 60 + parseFloat(p[1]);
        });
        const text = lines
          .slice(lines.indexOf(timeLine) + 1)
          .join(" ")
          .replace(/<[^>]+>/g, "")
          .trim();
        if (text) segments.push({ text, offset: rawStart, duration: rawEnd - rawStart });
      }

      const thumbs =
        ((vd!["thumbnail"] as Record<string, unknown>)?.[
          "thumbnails"
        ] as unknown[]) ?? [];
      const thumbnail_url =
        ((thumbs[thumbs.length - 1] as Record<string, unknown>)?.[
          "url"
        ] as string) ?? "";

      return {
        ok: true as const,
        segments,
        source_language: languageCode,
        metadata: {
          title: (vd!["title"] as string) ?? "",
          channel_name: (vd!["author"] as string) ?? "",
          channel_id: (vd!["channelId"] as string) ?? "",
          duration: parseInt((vd!["lengthSeconds"] as string) ?? "0", 10),
          thumbnail_url,
          description: (vd!["shortDescription"] as string) ?? "",
        },
      };
    })
    .catch((e: unknown) => ({
      ok: false as const,
      error: String(e instanceof Error ? e.message : e),
    }));
}
