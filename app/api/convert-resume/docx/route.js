import { buildDevsincResumeDocx } from "@/lib/buildDevsincResumeDocx";
import { resourceToDevsincResume } from "@/lib/resourceToDevsincResume";
import { requireAuth } from "@/lib/supabase/requireAuth";

export const runtime = "nodejs";

/** Regenerate DOCX from an already-parsed resource object */
export async function POST(request) {
  const { error: authError } = await requireAuth();
  if (authError) return Response.json({ error: authError }, { status: 401 });

  try {
    const { resource } = await request.json();
    if (!resource?.name) {
      return Response.json({ error: "Resource data with at least a name is required." }, { status: 400 });
    }

    const resume = resource.workExperience
      ? resource
      : resourceToDevsincResume(resource);
    const { buffer, filename } = await buildDevsincResumeDocx(resume);

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("DOCX export error:", err);
    return Response.json({ error: err.message ?? "Failed to generate document." }, { status: 500 });
  }
}
