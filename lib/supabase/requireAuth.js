import { createClient } from "@/lib/supabase/server";
import { isDevsincEmail } from "@/lib/auth";

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: "Unauthorized" };
  }

  if (!isDevsincEmail(user.email)) {
    await supabase.auth.signOut();
    return { supabase, user: null, error: "Only @devsinc.com accounts are allowed." };
  }

  return { supabase, user, error: null };
}
