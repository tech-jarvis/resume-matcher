import { requireAuth } from "@/lib/supabase/requireAuth";
import { updateUserPassword, verifyUserCredentials } from "@/lib/users";

export async function POST(request) {
  const { user, error } = await requireAuth();
  if (error) return Response.json({ error }, { status: 401 });

  try {
    const { current_password, new_password } = await request.json();

    if (!new_password || new_password.length < 8) {
      return Response.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const row = await verifyUserCredentials(user.email, current_password);
    if (!row) {
      return Response.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    await updateUserPassword(user.id, new_password);
    return Response.json({ message: "Password updated successfully." });
  } catch (err) {
    return Response.json({ error: err.message ?? "Failed to update password." }, { status: 500 });
  }
}
