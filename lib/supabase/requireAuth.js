import { isDevsincEmail } from "@/lib/auth";
import { getSessionUser, toAuthUser } from "@/lib/session";
import { findUserById, sanitizeUser } from "@/lib/users";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireAuth() {
  const session = await getSessionUser();
  if (!session?.id) {
    return { supabase: null, user: null, profile: null, error: "Unauthorized" };
  }

  if (!isDevsincEmail(session.email)) {
    return { supabase: null, user: null, profile: null, error: "Only @devsinc.com accounts are allowed." };
  }

  const row = await findUserById(session.id);
  if (!row) {
    return { supabase: null, user: null, profile: null, error: "User not found." };
  }

  return {
    supabase: createAdminClient(),
    user: toAuthUser(session),
    profile: sanitizeUser(row),
    error: null,
  };
}
