import browser from "webextension-polyfill";
import type { CaptionFetchResult } from "@/lib/youtube/timedtext";
import { submitFetch } from "@/lib/api";
import { getValidAccessToken } from "@/lib/auth";
import type { BgMessage, BgResponse } from "@/shared/types";

const log = (...args: unknown[]) => console.log("[yt2text]", ...args);

browser.runtime.onMessage.addListener(
  (rawMsg: unknown, sender): Promise<BgResponse> => {
    const msg = rawMsg as BgMessage;
    log("message received:", msg.type, "tabId:", sender.tab?.id);
    return handleMessage(msg, sender.tab?.id);
  },
);

async function handleMessage(
  msg: BgMessage,
  tabId?: number,
): Promise<BgResponse> {
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
  log(
    "fetchAndSubmit start | videoId:",
    videoId,
    "tabId:",
    tabId,
    "jobId:",
    jobId,
  );

  const token = await getValidAccessToken();
  if (!token) {
    log("no access token");
    return { ok: false, error: "Not authenticated" };
  }
  log("token OK");

  if (!tabId) return { ok: false, error: "No active tab" };

  type TabResult =
    | {
        ok: true;
        segments: CaptionFetchResult["segments"];
        source_language: string;
        metadata: CaptionFetchResult["metadata"];
      }
    | { ok: false; error: string };

  log("injecting fetchCaptionsViaXHR into tab", tabId);
  let tabResult: TabResult | null = null;

  try {
    const results = await browser.scripting.executeScript({
      target: { tabId },
      func: fetchCaptionsViaXHR,
      world: "MAIN",
    });
    tabResult = (results[0]?.result ?? null) as TabResult | null;
    log(
      "fetchCaptionsViaXHR result ok:",
      (tabResult as { ok?: boolean } | null)?.ok,
      "segments:",
      (tabResult as { segments?: unknown[] } | null)?.segments?.length ?? "n/a",
    );
  } catch (e) {
    log("executeScript threw:", e);
    return {
      ok: false,
      error: `executeScript failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  if (!tabResult) {
    log("tabResult is null");
    return {
      ok: false,
      error: "No result from page — try refreshing the YouTube tab",
    };
  }
  if (!tabResult.ok) {
    log("tabResult error:", tabResult.error);
    return { ok: false, error: tabResult.error };
  }
  if (tabResult.segments.length === 0) {
    log("0 segments parsed");
    return { ok: false, error: "Captions fetched but 0 segments parsed" };
  }

  log(
    "segments:",
    tabResult.segments.length,
    "| first:",
    JSON.stringify(tabResult.segments[0]),
  );
  log(
    "metadata title:",
    tabResult.metadata.title,
    "language:",
    tabResult.source_language,
  );

  try {
    log("submitting to API...");
    const response = await submitFetch({
      job_id: jobId,
      video_id: videoId,
      target_language: "en",
      source_language: tabResult.source_language,
      metadata: tabResult.metadata,
      segments: tabResult.segments,
    });
    log("submitFetch OK | job_id:", response.job_id);
    return { ok: true, jobId: response.job_id };
  } catch (e) {
    log("submitFetch error:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// Injected into the YouTube tab (world: MAIN).
// Uses InnerTube get_transcript API (same as YouTube's "Show transcript" button).
// Uses XHR — not intercepted by YouTube's Service Worker.
function fetchCaptionsViaXHR(): Promise<
  | {
      ok: true;
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
    }
  | { ok: false; error: string }
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;

  const pr = w["ytInitialPlayerResponse"] as
    | Record<string, unknown>
    | undefined;
  console.log("[yt2text][tab] ytInitialPlayerResponse present:", !!pr);
  if (!pr)
    return Promise.resolve({
      ok: false,
      error: "ytInitialPlayerResponse not found — try refreshing the page",
    });

  if (pr["isLive"] || pr["isLiveContent"]) {
    return Promise.resolve({
      ok: false,
      error: "live stream: captions not available",
    });
  }

  const vd = pr["videoDetails"] as Record<string, unknown> | undefined;
  if (!vd)
    return Promise.resolve({
      ok: false,
      error: "videoDetails missing in player response",
    });

  const videoId = vd["videoId"] as string;
  console.log("[yt2text][tab] videoId:", videoId, "title:", vd["title"]);

  // Build InnerTube context from ytcfg (same context YouTube itself uses)
  const apiKey: string =
    w["ytcfg"]?.get?.("INNERTUBE_API_KEY") ??
    "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
  const innertubeContext = w["ytcfg"]?.get?.("INNERTUBE_CONTEXT") ?? {
    client: {
      clientName: "WEB",
      clientVersion: "2.20240101.00.00",
      hl: "en",
      gl: "US",
    },
  };
  console.log(
    "[yt2text][tab] innertube apiKey:",
    apiKey.substring(0, 10) + "...",
  );

  // Extract pre-encoded transcript params from ytInitialData (YouTube puts them there for the transcript panel)
  function findTranscriptParams(obj: unknown, depth = 0): string | null {
    if (depth > 12 || !obj || typeof obj !== "object") return null;
    const o = obj as Record<string, unknown>;
    if ("getTranscriptEndpoint" in o) {
      const ep = o["getTranscriptEndpoint"] as Record<string, unknown>;
      if (typeof ep?.["params"] === "string") return ep["params"] as string;
    }
    for (const v of Object.values(o)) {
      const r = Array.isArray(v)
        ? v.reduce<string | null>(
            (acc, item) => acc ?? findTranscriptParams(item, depth + 1),
            null,
          )
        : findTranscriptParams(v, depth + 1);
      if (r) return r;
    }
    return null;
  }

  const params = findTranscriptParams(w["ytInitialData"]);
  console.log(
    "[yt2text][tab] transcript params from ytInitialData:",
    params ? params.substring(0, 20) + "..." : "NOT FOUND",
  );
  if (!params)
    return Promise.resolve({
      ok: false,
      error:
        "Could not find transcript params in ytInitialData — video may not have a transcript",
    });

  const thumbs =
    ((vd["thumbnail"] as Record<string, unknown>)?.[
      "thumbnails"
    ] as unknown[]) ?? [];
  const thumbnail_url =
    ((thumbs[thumbs.length - 1] as Record<string, unknown>)?.[
      "url"
    ] as string) ?? "";

  const metadata = {
    title: (vd["title"] as string) ?? "",
    channel_name: (vd["author"] as string) ?? "",
    channel_id: (vd["channelId"] as string) ?? "",
    duration: parseInt((vd["lengthSeconds"] as string) ?? "0", 10),
    thumbnail_url,
    description: (vd["shortDescription"] as string) ?? "",
  };

  console.log(
    "[yt2text][tab] innertubeContext:",
    JSON.stringify(innertubeContext)?.substring(0, 300),
  );

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/youtubei/v1/get_transcript?prettyPrint=false`);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {
      console.log(
        "[yt2text][tab] InnerTube status:",
        xhr.status,
        "| length:",
        xhr.responseText.length,
      );
      if (xhr.status !== 200) {
        console.log("[yt2text][tab] InnerTube error body:", xhr.responseText);
        resolve({
          ok: false,
          error: `InnerTube HTTP ${xhr.status}: ${xhr.responseText.substring(0, 200)}`,
        });
        return;
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = JSON.parse(xhr.responseText) as any;
        console.log(
          "[yt2text][tab] InnerTube response keys:",
          Object.keys(json),
        );

        // Navigate to transcript segments
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const actions: any[] = json?.actions ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let initialSegments: any[] | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let langCode = "en";

        for (const action of actions) {
          const panel =
            action?.updateEngagementPanelAction?.content?.transcriptRenderer;
          if (!panel) continue;
          const body =
            panel?.content?.transcriptSearchPanelRenderer?.body
              ?.transcriptSegmentListRenderer;
          if (body) {
            initialSegments = body?.initialSegments ?? [];
            langCode =
              panel?.content?.transcriptSearchPanelRenderer?.footer
                ?.transcriptFooterRenderer?.languageMenu
                ?.sortFilterSubMenuRenderer?.subMenuItems?.[0]?.continuation
                ?.reloadContinuationData?.clickTrackingParams ?? langCode;
            break;
          }
        }

        // Also check for header languageCode
        for (const action of actions) {
          const header =
            action?.updateEngagementPanelAction?.content?.transcriptRenderer
              ?.header?.transcriptHeaderRenderer;
          if (header?.languageMenu) {
            const items =
              header.languageMenu?.transcriptLanguageListRenderer?.languages ??
              [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const selected = items.find(
              (i: any) => i?.transcriptLanguageButtonRenderer?.isSelected,
            );
            if (selected) {
              langCode =
                selected?.transcriptLanguageButtonRenderer?.languageCode ??
                langCode;
            }
            break;
          }
        }

        console.log(
          "[yt2text][tab] segments found:",
          initialSegments?.length ?? "null",
          "langCode:",
          langCode,
        );

        if (!initialSegments || initialSegments.length === 0) {
          console.log(
            "[yt2text][tab] full response for debug:",
            xhr.responseText.substring(0, 500),
          );
          resolve({
            ok: false,
            error: "InnerTube returned no transcript segments",
          });
          return;
        }

        const segments: { text: string; offset: number; duration: number }[] =
          [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const seg of initialSegments) {
          const r = seg?.transcriptSegmentRenderer;
          if (!r) continue;
          const text = (r?.snippet?.runs ?? [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((run: any) => run?.text ?? "")
            .join("")
            .trim();
          if (!text) continue;
          const startMs = parseInt(r?.startMs ?? "0", 10);
          const endMs = parseInt(r?.endMs ?? "0", 10);
          segments.push({
            text,
            offset: startMs / 1000,
            duration: (endMs - startMs) / 1000,
          });
        }

        console.log(
          "[yt2text][tab] parsed segments:",
          segments.length,
          "| first:",
          JSON.stringify(segments[0]),
        );
        resolve({ ok: true, segments, source_language: langCode, metadata });
      } catch (e) {
        resolve({ ok: false, error: `JSON parse error: ${String(e)}` });
      }
    };

    xhr.onerror = () => {
      console.log("[yt2text][tab] XHR network error");
      resolve({ ok: false, error: "XHR network error" });
    };

    xhr.send(JSON.stringify({ context: innertubeContext, params }));
  });
}
