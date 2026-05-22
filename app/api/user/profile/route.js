import { requireAuth } from "@/lib/supabase/requireAuth";
import { sanitizeUser, updateUserProfile } from "@/lib/users";

const PROFILE_FIELDS = [
  "full_name",
  "designation",
  "team",
  "primary_stack",
  "stacks",
  "experience",
  "timezone",
  "industries",
  "dependency",
  "bio",
  "linkedin_url",
  "github_url",
  "portfolio_url",
  "other_links",
  "resume_path",
  "avatar_url",
];

export async function GET() {
  const { profile, error } = await requireAuth();
  if (error) return Response.json({ error }, { status: 401 });
  return Response.json({ profile });
}

export async function PATCH(request) {
  const { user, error } = await requireAuth();
  if (error) return Response.json({ error }, { status: 401 });

  try {
    const body = await request.json();
    const updates = {};
    for (const key of PROFILE_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const profile = await updateUserProfile(user.id, updates);
    return Response.json({ profile: sanitizeUser(profile) });
  } catch (err) {
    return Response.json({ error: err.message ?? "Failed to save profile." }, { status: 500 });
  }
}
