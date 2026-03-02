import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for build-time / static generation contexts
 * where cookies() is not available (generateStaticParams, sitemap, etc.).
 * Uses anon key — relies on RLS public read policies.
 */
export function createStaticClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
