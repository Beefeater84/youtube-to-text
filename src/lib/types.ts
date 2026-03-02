export interface Channel {
  id: string;
  youtube_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
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
  status: 'pending' | 'queued' | 'processing' | 'done' | 'failed';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptWithChannel extends Transcript {
  channels: Channel;
}

export interface ChannelWithTranscripts extends Channel {
  transcripts: Transcript[];
}
