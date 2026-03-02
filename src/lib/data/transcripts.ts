import { createClient } from '@/lib/supabase/server';
import { createStaticClient } from '@/lib/supabase/static';
import type { TranscriptWithChannel, Transcript } from '@/lib/types';

export async function getPublishedTranscripts(
  limit = 30,
): Promise<TranscriptWithChannel[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('transcripts')
    .select('*, channels(*)')
    .eq('status', 'done')
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data as TranscriptWithChannel[]) ?? [];
}

export async function getTranscriptBySlug(
  slug: string,
): Promise<TranscriptWithChannel | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('transcripts')
    .select('*, channels(*)')
    .eq('slug', slug)
    .eq('status', 'done')
    .single();
  return (data as TranscriptWithChannel) ?? null;
}

export async function getAllTranscriptSlugs(): Promise<string[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('transcripts')
    .select('slug')
    .eq('status', 'done');
  return (data ?? []).map((t: Pick<Transcript, 'slug'>) => t.slug);
}
