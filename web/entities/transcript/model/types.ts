export interface Channel {
  id: string;
  youtube_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  slug: string;
}

export interface Transcript {
  id: string;
  channel_id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  slug: string;
  language: string;
  duration_seconds: number | null;
  markdown_url: string | null;
  status: "pending" | "queued" | "processing" | "done" | "failed" | "waiting_dependency";
  user_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptWithChannel extends Transcript {
  channels: Channel;
}

export interface LanguageVersion {
  language: string;
  slug: string;
  markdown_url?: string | null;
}

export interface TranscriptDashboardItem extends Transcript {
  channel_slug: string | null;
}

export interface VideoGroup {
  youtube_video_id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  channel_title: string | null;
  channel_slug: string | null;
  languages: LanguageVersion[];
  duration_seconds: number | null;
  created_at: string;
}
