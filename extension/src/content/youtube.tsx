import { render, h } from "preact";
import { useState, useEffect } from "preact/hooks";
import browser from "webextension-polyfill";
import type { BgMessage, BgResponse } from "@/shared/types";

type Status = "idle" | "loading" | "done" | "error";

function SaveButton({ videoId, jobId }: { videoId: string; jobId?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function trigger() {
    setStatus("loading");
    setError("");
    try {
      const msg: BgMessage = {
        type: "FETCH_AND_SUBMIT",
        videoId,
        jobId,
      };
      const resp = (await browser.runtime.sendMessage(msg)) as BgResponse;
      if ("ok" in resp && resp.ok) {
        setStatus("done");
      } else {
        setError("error" in resp ? resp.error : "Unknown error");
        setStatus("error");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("extension context invalidated")) {
        setError("Extension was reloaded — please refresh the page");
      } else {
        setError(msg);
      }
      setStatus("error");
    }
  }

  // Auto-trigger when a job_id is present in the URL
  useEffect(() => {
    if (jobId && status === "idle") {
      trigger();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: "4px",
        margin: "8px 0",
      }}
    >
      <button
        onClick={trigger}
        disabled={status === "loading" || status === "done"}
        style={{
          background: status === "done" ? "#2d7a2d" : "#cc0000",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          padding: "6px 14px",
          fontSize: "13px",
          fontWeight: 600,
          cursor:
            status === "loading" || status === "done" ? "default" : "pointer",
          opacity: status === "loading" ? 0.7 : 1,
        }}
      >
        {status === "idle" && "Save transcript"}
        {status === "loading" && "Saving…"}
        {status === "done" && "Saved ✓"}
        {status === "error" && "Retry"}
      </button>
      {status === "error" && (
        <span style={{ color: "#cc0000", fontSize: "12px" }}>{error}</span>
      )}
    </div>
  );
}

function inject(videoId: string, jobId?: string) {
  const existing = document.getElementById("yt2text-btn");
  if (existing) return;

  // Try multiple anchor selectors for YouTube's layout
  const anchors = [
    "#above-the-fold #top-row",
    "#info-contents",
    "#primary-inner ytd-video-primary-info-renderer",
    "#container.ytd-video-primary-info-renderer",
  ];

  let host: Element | null = null;
  for (const sel of anchors) {
    host = document.querySelector(sel);
    if (host) break;
  }
  if (!host) return;

  const wrapper = document.createElement("div");
  wrapper.id = "yt2text-btn";
  host.insertAdjacentElement("afterend", wrapper);
  render(<SaveButton videoId={videoId} jobId={jobId} />, wrapper);
}

function getVideoId(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("v");
}

function getJobId(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("yt2text_job");
}

function tryInject() {
  const videoId = getVideoId();
  if (!videoId) return;
  const jobId = getJobId() ?? undefined;
  inject(videoId, jobId);
}

// YouTube is an SPA — watch for navigation events
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    const existing = document.getElementById("yt2text-btn");
    existing?.remove();
    setTimeout(tryInject, 1500);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial inject (with retry for slow YouTube renders)
setTimeout(tryInject, 1500);
setTimeout(tryInject, 3000);
