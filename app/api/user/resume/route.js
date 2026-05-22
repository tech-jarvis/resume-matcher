import { requireAuth } from "@/lib/supabase/requireAuth";
import { updateUserProfile } from "@/lib/users";

export async function POST(request) {
  const { user, supabase, error } = await requireAuth();
  if (error) return Response.json({ error }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({ error: "File must be under 10 MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "pdf";
    const path = `${user.id}/resume-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from("resumes")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadErr) throw uploadErr;

    const profile = await updateUserProfile(user.id, { resume_path: path });
    return Response.json({ resume_path: path, profile });
  } catch (err) {
    return Response.json({ error: err.message ?? "Upload failed." }, { status: 500 });
  }
}

export async function GET() {
  const { user, supabase, profile, error } = await requireAuth();
  if (error) return Response.json({ error }, { status: 401 });

  if (!profile?.resume_path) {
    return Response.json({ error: "No resume on file." }, { status: 404 });
  }

  const { data, error: urlErr } = await supabase.storage
    .from("resumes")
    .createSignedUrl(profile.resume_path, 120);

  if (urlErr) return Response.json({ error: urlErr.message }, { status: 500 });
  return Response.json({ url: data.signedUrl });
}
