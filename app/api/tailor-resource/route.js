import { resourceToDevsincResume } from "@/lib/resourceToDevsincResume";
import { tailorResumeForJD } from "@/lib/tailorResumeForJD";
import { buildDevsincResumeDocx } from "@/lib/buildDevsincResumeDocx";
import { apiErrorResponse } from "@/lib/apiErrors";
import { requireAuth } from "@/lib/supabase/requireAuth";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Tailor an already-matched candidate (a resource row, not an uploaded file)
 * to a JD and return a downloadable Devsinc .docx. Used by the per-match
 * "Tailor & download" button in the match results.
 */
export async function POST(request) {
  const { error: authError } = await requireAuth();
  if (authError) return Response.json({ error: authError }, { status: 401 });

  try {
    const { resource, jd } = await request.json();

    if (!jd || typeof jd !== "string" || jd.trim().length < 20) {
      return Response.json(
        { error: "A job description (at least 20 characters) is required." },
        { status: 400 }
      );
    }
    if (!resource || !resource.name) {
      return Response.json(
        { error: "A candidate resource with a name is required." },
        { status: 400 }
      );
    }

    const baseResume = resourceToDevsincResume(resource);
    const tailored = await tailorResumeForJD(baseResume, jd.trim());
    const { buffer, filename } = await buildDevsincResumeDocx(tailored);

    return Response.json({
      resume: tailored,
      filename,
      docxBase64: buffer.toString("base64"),
    });
  } catch (err) {
    return apiErrorResponse(err, "Tailor resource error");
  }
}
