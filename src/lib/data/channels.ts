import { createClient } from '@/lib/supabase/server';
import { createStaticClient } from '@/lib/supabase/static';
import type { Channel, ChannelWithTranscripts } from '@/lib/types';

export async function getChannels(): Promise<Channel[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('channels')
    .select('*')
    .order('title');
  return (data as Channel[]) ?? [];
}

export async function getChannelBySlug(
  slug: string,
): Promise<ChannelWithTranscripts | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('channels')
    .select('*, transcripts(*)')
    .eq('slug', slug)
    .single();
  if (!data) return null;
  const channel = data as ChannelWithTranscripts;
  channel.transcripts = channel.transcripts.filter((t) => t.status === 'done');
  return channel;
}

export async function getAllChannelSlugs(): Promise<string[]> {
  const supabase = createStaticClient();
  const { data } = await supabase.from('channels').select('slug');
  return (data ?? []).map((c: Pick<Channel, 'slug'>) => c.slug);
}
