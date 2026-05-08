import { getValidAccessToken } from "@/lib/auth";
import type {
  SubmitFetchPayload,
  SubmitFetchResponse,
  JobInfo,
} from "@/shared/types";

const APP_URL = import.meta.env.VITE_APP_URL as string;

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getValidAccessToken();
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function submitFetch(
  payload: SubmitFetchPayload,
): Promise<SubmitFetchResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${APP_URL}/api/extension/submit-fetch`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<SubmitFetchResponse>;
}

export async function getJobsByVideo(videoId: string): Promise<JobInfo[]> {
  const headers = await authHeaders();
  const res = await fetch(
    `${APP_URL}/api/extension/jobs/by-video?video_id=${encodeURIComponent(videoId)}`,
    { headers },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { jobs: JobInfo[] };
  return data.jobs ?? [];
}
