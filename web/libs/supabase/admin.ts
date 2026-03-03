import { createClient } from "@supabase/supabase-js";

/**
 * Server-only admin client that bypasses RLS.
 * Use for service-level operations (workers, migrations, seeding).
 * NEVER expose on the client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
