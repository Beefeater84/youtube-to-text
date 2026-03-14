export interface Channel {
  id: string;
  youtube_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  slug: string;
}

export interface ChannelWithCount extends Channel {
  transcript_count: number;
}
