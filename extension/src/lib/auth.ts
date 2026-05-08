import { createClient } from "@supabase/supabase-js";
import { getStoredAuth, setStoredAuth, clearStoredAuth } from "@/lib/storage";
import type { StoredAuth } from "@/shared/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const APP_URL = import.meta.env.VITE_APP_URL as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export async function getValidAccessToken(): Promise<string | null> {
  const stored = await getStoredAuth();
  if (!stored) return null;

  // If still valid for at least 60 s, return as-is
  if (stored.expires_at - Date.now() / 1000 > 60) {
    return stored.access_token;
  }

  // Try to refresh
  const { data, error } = await supabase.auth.setSession({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
  });
  if (error || !data.session) {
    await clearStoredAuth();
    return null;
  }
  const refreshed: StoredAuth = {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at ?? 0,
  };
  await setStoredAuth(refreshed);
  return refreshed.access_token;
}

export function buildOAuthUrl(): string {
  const redirectTo = `${APP_URL}/auth/extension-callback`;
  const params = new URLSearchParams({
    provider: "google",
    redirect_to: redirectTo,
  });
  return `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;
}

export async function logout(): Promise<void> {
  await clearStoredAuth();
}
