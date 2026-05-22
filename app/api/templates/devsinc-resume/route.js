import fs from "fs/promises";
import {
  DEVSINC_RESUME_TEMPLATE_DOCX_PATH,
  DEVSINC_RESUME_TEMPLATE_FILENAME,
  DEVSINC_RESUME_TEMPLATE_PATH,
} from "@/lib/devsincTemplate";
import { requireAuth } from "@/lib/supabase/requireAuth";

export const runtime = "nodejs";

export async function GET() {
  const { error: authError } = await requireAuth();
  if (authError) return Response.json({ error: authError }, { status: 401 });

  try {
    let buffer;
    let contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    try {
      buffer = await fs.readFile(DEVSINC_RESUME_TEMPLATE_DOCX_PATH);
    } catch {
      buffer = await fs.readFile(DEVSINC_RESUME_TEMPLATE_PATH);
      contentType = "application/pdf";
    }
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${DEVSINC_RESUME_TEMPLATE_FILENAME}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Template download error:", err);
    return Response.json({ error: "Resume template file not found." }, { status: 404 });
  }
}
