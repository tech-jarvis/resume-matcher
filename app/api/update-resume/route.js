import { extractTextFromBuffer } from "@/lib/extractDocumentText";
import { isSupportedFilename } from "@/lib/supportedFormats";
import { parseDevsincResumeWithClaude } from "@/lib/parseDevsincResumeWithClaude";
import { tailorResumeForJD } from "@/lib/tailorResumeForJD";
import { buildDevsincResumeDocx } from "@/lib/buildDevsincResumeDocx";
import { requireAuth } from "@/lib/supabase/requireAuth";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request) {
  const { error: authError } = await requireAuth();
  if (authError) return Response.json({ error: authError }, { status: 401 });

  try {
    const contentType = request.headers.get("content-type") || "";
    let rawText = "";
    let jd = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      jd = String(formData.get("jd") || "").trim();
      const file = formData.get("file");
      const pastedText = String(formData.get("text") || "").trim();

      if (!jd || jd.length < 20) {
        return Response.json(
          { error: "Paste a job description (at least 20 characters)." },
          { status: 400 }
        );
      }

      if (file && typeof file !== "string") {
        const filename = file.name || "resume.pdf";
        if (!isSupportedFilename(filename)) {
          return Response.json(
            { error: "Unsupported format. Upload PDF, DOCX, DOC, or TXT." },
            { status: 400 }
          );
        }
        if (file.size > 10 * 1024 * 1024) {
          return Response.json({ error: "File must be under 10 MB." }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        rawText = await extractTextFromBuffer(buffer, filename);
      } else if (pastedText.length >= 50) {
        rawText = pastedText;
      } else {
        return Response.json(
          { error: "Upload a resume file or paste resume text (50+ characters)." },
          { status: 400 }
        );
      }
    } else {
      const body = await request.json();
      jd = String(body.jd || "").trim();
      rawText = String(body.text || "").trim();

      if (!jd || jd.length < 20) {
        return Response.json(
          { error: "Job description is required (at least 20 characters)." },
          { status: 400 }
        );
      }
      if (rawText.length < 50) {
        return Response.json(
          { error: "Resume text is required (at least 50 characters)." },
          { status: 400 }
        );
      }
    }

    const parsed = await parseDevsincResumeWithClaude(rawText);
    const tailored = await tailorResumeForJD(parsed, jd);
    const { buffer: docxBuffer, filename: docxFilename } =
      await buildDevsincResumeDocx(tailored);

    return Response.json({
      resume: tailored,
      original: parsed,
      filename: docxFilename,
      docxBase64: docxBuffer.toString("base64"),
      extractedChars: rawText.length,
    });
  } catch (err) {
    console.error("Update resume error:", err);
    return Response.json(
      { error: err.message ?? "Failed to update resume for job description." },
      { status: 500 }
    );
  }
}
