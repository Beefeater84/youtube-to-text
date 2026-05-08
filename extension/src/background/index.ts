import browser from "webextension-polyfill";
import { fetchCaptionsFromPage, isLiveStream, type CaptionFetchResult } from "@/lib/youtube/timedtext";
import { submitFetch } from "@/lib/api";
import { getValidAccessToken } from "@/lib/auth";
import type { BgMessage, BgResponse } from "@/shared/types";

browser.runtime.onMessage.addListener(
  (rawMsg: unknown, _sender): Promise<BgResponse> => {
    const msg = rawMsg as BgMessage;
    return handleMessage(msg);
  },
);

async function handleMessage(msg: BgMessage): Promise<BgResponse> {
  if (msg.type === "FETCH_AND_SUBMIT") {
    return fetchAndSubmit(msg.videoId, msg.jobId);
  }
  return { ok: false, error: "Unknown message type" };
}

async function fetchAndSubmit(
  videoId: string,
  jobId?: string,
): Promise<BgResponse> {
  const token = await getValidAccessToken();
  if (!token) return { ok: false, error: "Not authenticated" };

  // Get the active YouTube tab to run the caption fetch in content script context
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id) return { ok: false, error: "No active tab" };

  // Execute caption fetch in the tab (has access to ytInitialPlayerResponse and YouTube cookies)
  let captionResult: CaptionFetchResult | null = null;
  let captionError: string | null = null;

  try {
    const results = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: fetchCaptionsInTab,
    });
    const result = results[0];
    if (result.error) {
      captionError = String(result.error);
    } else {
      captionResult = result.result as CaptionFetchResult;
    }
  } catch (e) {
    captionError = e instanceof Error ? e.message : String(e);
  }

  if (captionError || !captionResult) {
    return { ok: false, error: captionError ?? "Caption fetch failed" };
  }

  // Check for live stream
  if (captionResult.segments.length === 0) {
    return { ok: false, error: "no captions available" };
  }

  try {
    const response = await submitFetch({
      job_id: jobId,
      video_id: videoId,
      target_language: "en",
      source_language: captionResult.source_language,
      metadata: captionResult.metadata,
      segments: captionResult.segments,
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
// It must be self-contained (no imports).
function fetchCaptionsInTab(): Promise<{
  segments: { text: string; offset: number; duration: number }[];
  source_language: string;
  metadata: {
    title: string;
    channel_name: string;
    channel_id: string;
    duration: number;
    thumbnail_url: string;
    description: string;
  };
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pr = (window as any)["ytInitialPlayerResponse"] as Record<
    string,
    unknown
  >;
  if (!pr) throw new Error("ytInitialPlayerResponse not found");

  if (pr["isLive"] || pr["isLiveContent"]) {
    throw new Error("live stream: captions not available");
  }

  const vd = pr["videoDetails"] as Record<string, unknown> | undefined;
  if (!vd) throw new Error("videoDetails missing");

  const captionRenderer = (
    pr["captions"] as Record<string, unknown> | undefined
  )?.["playerCaptionsTracklistRenderer"] as
    | Record<string, unknown>
    | undefined;
  const tracks = (captionRenderer?.["captionTracks"] as unknown[]) ?? [];

  if (tracks.length === 0) throw new Error("no captions available");

  function pickTrack(
    ts: unknown[],
  ): Record<string, unknown> {
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
  const baseUrl = track["baseUrl"] as string;
  const languageCode = track["languageCode"] as string;

  return fetch(`${baseUrl}&fmt=json3`)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((json: unknown) => {
      const events = ((json as Record<string, unknown>)["events"] as unknown[]) ?? [];
      const segments: { text: string; offset: number; duration: number }[] = [];
      for (const ev of events) {
        const e = ev as Record<string, unknown>;
        const segs = (e["segs"] as unknown[]) ?? [];
        if (!segs.length) continue;
        const text = segs
          .map((s) => ((s as Record<string, unknown>)["utf8"] as string) ?? "")
          .join("")
          .replace(/\n/g, " ")
          .trim();
        if (!text) continue;
        segments.push({
          text,
          offset: (e["tStartMs"] as number) / 1000,
          duration: ((e["dDurationMs"] as number) ?? 0) / 1000,
        });
      }

      const thumbs =
        ((vd["thumbnail"] as Record<string, unknown>)?.[
          "thumbnails"
        ] as unknown[]) ?? [];
      const thumbnail_url =
        ((thumbs[thumbs.length - 1] as Record<string, unknown>)?.[
          "url"
        ] as string) ?? "";

      return {
        segments,
        source_language: languageCode,
        metadata: {
          title: (vd["title"] as string) ?? "",
          channel_name: (vd["author"] as string) ?? "",
          channel_id: (vd["channelId"] as string) ?? "",
          duration: parseInt((vd["lengthSeconds"] as string) ?? "0", 10),
          thumbnail_url,
          description: (vd["shortDescription"] as string) ?? "",
        },
      };
    });
}
