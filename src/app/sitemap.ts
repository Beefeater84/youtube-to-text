import type { MetadataRoute } from 'next';
import { createStaticClient } from '@/lib/supabase/static';
import { siteUrl } from '@/lib/format';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient();

  const [{ data: transcripts }, { data: channels }] = await Promise.all([
    supabase
      .from('transcripts')
      .select('slug, updated_at')
      .eq('status', 'done'),
    supabase.from('channels').select('slug, updated_at'),
  ]);

  const transcriptEntries: MetadataRoute.Sitemap = (transcripts ?? []).map(
    (t) => ({
      url: siteUrl(`/transcripts/${t.slug}`),
      lastModified: t.updated_at,
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
  );

  const channelEntries: MetadataRoute.Sitemap = (channels ?? []).map((c) => ({
    url: siteUrl(`/channels/${c.slug}`),
    lastModified: c.updated_at,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [
    {
      url: siteUrl(),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...transcriptEntries,
    ...channelEntries,
  ];
}
