export type TranscriptStatus =
  | "pending"
  | "queued"
  | "processing"
  | "done"
  | "failed";

export interface TranscriptJob {
  id: string;
  channel_id: string | null;
  youtube_video_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  slug: string;
  language: string;
  duration_seconds: number | null;
  markdown_url: string | null;
  status: TranscriptStatus;
  user_id: string | null;
  published_at: string | null;
  retry_count: number;
  error_message: string | null;
  started_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessedSection {
  title: string;
  timestamp: number;
  content: string;
}

export interface PipelineResult {
  markdownUrl: string;
  durationSeconds: number;
}
