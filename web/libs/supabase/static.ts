import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for build-time / static generation contexts
 * where cookies() is not available (generateStaticParams, sitemap, etc.).
 * Uses anon key — relies on RLS public read policies.
 */
export function createStaticClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      `Missing Supabase environment variables at runtime. URL: ${url ? "set" : "MISSING"}, KEY: ${key ? "set" : "MISSING"}. ` +
      "Check your Dockerfile and environment configuration."
    );
  }

  return createSupabaseClient(url, key);
}
