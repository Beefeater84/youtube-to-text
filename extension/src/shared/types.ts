export interface RawSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface VideoMetadata {
  title: string;
  channel_name: string;
  channel_id: string;
  duration: number;
  thumbnail_url: string;
  description: string;
}

export interface SubmitFetchPayload {
  job_id?: string;
  video_id: string;
  target_language: string;
  source_language: string;
  metadata: VideoMetadata;
  segments: RawSegment[];
}

export interface SubmitFetchResponse {
  job_id: string;
  status: "queued";
}

export interface JobInfo {
  id: string;
  status: string;
  youtube_video_id: string;
  created_at: string;
}

export interface StoredAuth {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/** Messages from content script → background */
export type BgMessage =
  | { type: "FETCH_AND_SUBMIT"; videoId: string; jobId?: string }
  | { type: "GET_JOBS"; videoId: string };

export type BgResponse =
  | { ok: true; jobId: string }
  | { ok: false; error: string }
  | { ok: true; jobs: JobInfo[] };
