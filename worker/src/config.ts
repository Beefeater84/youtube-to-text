/**
 * Loads and validates required environment variables for the worker process.
 * Fails fast on startup if any variable is missing.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? "5000"),
  staleMinutes: Number(process.env.STALE_MINUTES ?? "15"),
  maxRetries: Number(process.env.MAX_RETRIES ?? "3"),
} as const;
