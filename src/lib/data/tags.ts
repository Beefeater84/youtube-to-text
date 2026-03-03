import { createClient } from '@/lib/supabase/server';
import type { Tag } from '@/lib/types';

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tags')
    .select('*')
    .order('name');
  return (data as Tag[]) ?? [];
}
