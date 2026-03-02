import { createClient } from '@/lib/supabase/server';
import { createStaticClient } from '@/lib/supabase/static';
import type {
  Channel,
  ChannelWithTags,
  ChannelWithTranscriptsAndTags,
  Tag,
} from '@/lib/types';

export async function getChannels(): Promise<ChannelWithTags[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('channels')
    .select('*, channel_tags(tags(*))')
    .order('title');
  return (data ?? []).map(flattenChannelTags);
}

export async function getChannelBySlug(
  slug: string,
): Promise<ChannelWithTranscriptsAndTags | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('channels')
    .select('*, transcripts(*), channel_tags(tags(*))')
    .eq('slug', slug)
    .single();
  if (!data) return null;
  const channel = flattenChannelTags(data) as ChannelWithTranscriptsAndTags;
  channel.transcripts = (channel.transcripts ?? []).filter(
    (t) => t.status === 'done',
  );
  return channel;
}

export async function getAllChannelSlugs(): Promise<string[]> {
  const supabase = createStaticClient();
  const { data } = await supabase.from('channels').select('slug');
  return (data ?? []).map((c: Pick<Channel, 'slug'>) => c.slug);
}

// Supabase returns { channel_tags: { tags: Tag }[] } — flatten to Tag[]
function flattenChannelTags<T extends Record<string, unknown>>(
  row: T,
): T & { tags: Tag[] } {
  const joined = (row.channel_tags ?? []) as { tags: Tag }[];
  const tags = joined.map((ct) => ct.tags);
  const { channel_tags: _, ...rest } = row;
  return { ...rest, tags } as T & { tags: Tag[] };
}
