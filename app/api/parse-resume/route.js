import { parseDevsincResumeWithClaude } from "@/lib/parseDevsincResumeWithClaude";
import { devsincResumeToResource } from "@/lib/resourceToDevsincResume";
import { extractTextFromBuffer } from "@/lib/extractDocumentText";
import { isSupportedFilename } from "@/lib/supportedFormats";
import { apiErrorResponse } from "@/lib/apiErrors";
import { requireAuth } from "@/lib/supabase/requireAuth";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request) {
  const { error: authError } = await requireAuth();
  if (authError) return Response.json({ error: authError }, { status: 401 });

  try {
    const contentType = request.headers.get("content-type") || "";
    let rawText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || typeof file === "string") {
        return Response.json({ error: "No file uploaded." }, { status: 400 });
      }
      const filename = file.name || "resume.pdf";
      if (!isSupportedFilename(filename)) {
        return Response.json(
          { error: "Unsupported format. Upload PDF, DOCX, DOC, TXT, MD, or RTF." },
          { status: 400 }
        );
      }
      if (file.size > 10 * 1024 * 1024) {
        return Response.json({ error: "File must be under 10 MB." }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      rawText = await extractTextFromBuffer(buffer, filename);
    } else {
      const body = await request.json();
      rawText = String(body.text || "");
    }

    if (!rawText || rawText.trim().length < 20) {
      return Response.json(
        { error: "Could not read enough resume text (at least 20 characters)." },
        { status: 400 }
      );
    }

    const resume = await parseDevsincResumeWithClaude(rawText);
    const resource = devsincResumeToResource(resume);

    return Response.json({ resume, resource });
  } catch (err) {
    return apiErrorResponse(err, "Parse resume error");
  }
}
