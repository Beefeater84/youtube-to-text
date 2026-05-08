import { render, h } from "preact";
import { useState, useEffect } from "preact/hooks";
import browser from "webextension-polyfill";
import { getStoredAuth, setStoredAuth, clearStoredAuth } from "@/lib/storage";
import { buildOAuthUrl } from "@/lib/auth";
import { supabase } from "@/lib/auth";
import type { JobInfo, StoredAuth } from "@/shared/types";

const APP_URL = import.meta.env.VITE_APP_URL as string;

function statusClass(status: string): string {
  if (status === "queued" || status === "pending") return "status-queued";
  if (status === "done") return "status-done";
  if (status === "awaiting_browser_fetch") return "status-awaiting";
  if (status === "failed") return "status-failed";
  return "";
}

function statusLabel(status: string): string {
  if (status === "awaiting_browser_fetch") return "waiting";
  return status;
}

function App() {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await getStoredAuth();
      setAuth(stored);
      if (stored) await loadJobs(stored.access_token);
      setLoading(false);
    })();

    // Listen for auth messages from the extension-callback page
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as {
        access_token?: string;
        refresh_token?: string;
        expires_at?: number;
      };
      if (data?.access_token && data?.refresh_token) {
        const newAuth: StoredAuth = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at ?? 0,
        };
        setStoredAuth(newAuth).then(() => {
          setAuth(newAuth);
          loadJobs(newAuth.access_token);
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  async function loadJobs(token: string) {
    try {
      const res = await fetch(`${APP_URL}/api/extension/jobs/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { jobs: JobInfo[] };
      setJobs(data.jobs ?? []);
    } catch {
      // non-critical
    }
  }

  function login() {
    const oauthUrl = buildOAuthUrl();
    // window.open keeps window.opener set so the callback page can postMessage back.
    // Chrome keeps the extension popup alive while this child window is open.
    window.open(oauthUrl, "yt2text-auth", "width=520,height=680");
  }

  async function logout() {
    await clearStoredAuth();
    setAuth(null);
    setJobs([]);
  }

  if (loading) {
    return (
      <div>
        <h1>YT2Text</h1>
        <p class="empty">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1>YT2Text</h1>
      {auth ? (
        <>
          <button class="btn btn-secondary" onClick={logout}>
            Sign out
          </button>
          <p class="user-info">Recent jobs</p>
          {jobs.length === 0 ? (
            <p class="empty">No jobs yet. Open a YouTube video and click "Save transcript".</p>
          ) : (
            <ul class="jobs-list">
              {jobs.map((j) => (
                <li key={j.id}>
                  <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {j.youtube_video_id}
                  </span>
                  <span class={`status-badge ${statusClass(j.status)}`}>
                    {statusLabel(j.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <button class="btn btn-primary" onClick={login}>
            Sign in with Google
          </button>
          <p class="empty">Sign in to save YouTube transcripts.</p>
        </>
      )}
    </div>
  );
}

const root = document.getElementById("app");
if (root) render(<App />, root);
