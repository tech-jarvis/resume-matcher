import {
  DEVSINC_RESUME_TEMPLATE_FILENAME,
  readDevsincResumeTemplate,
} from "@/lib/devsincTemplate";
import { requireAuth } from "@/lib/supabase/requireAuth";

export const runtime = "nodejs";

export async function GET() {
  const { error: authError } = await requireAuth();
  if (authError) return Response.json({ error: authError }, { status: 401 });

  try {
    const buffer = await readDevsincResumeTemplate();
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${DEVSINC_RESUME_TEMPLATE_FILENAME}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Template download error:", err);
    return Response.json({ error: "Resume template file not found." }, { status: 404 });
  }
}
