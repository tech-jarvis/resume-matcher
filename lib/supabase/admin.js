import { createClient } from "@supabase/supabase-js";
import { assertSupabaseConfigured } from "@/lib/apiErrors";

/** Server-only Supabase client (bypasses RLS). Never import in client components. */
export function createAdminClient() {
  assertSupabaseConfigured();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
