import { extractTextFromBuffer } from "@/lib/extractDocumentText";
import { isSupportedFilename } from "@/lib/supportedFormats";
import { parseResumeWithClaude } from "@/lib/parseResumeWithClaude";
import { buildDevsincDocx } from "@/lib/buildDevsincDocx";
import { requireAuth } from "@/lib/supabase/requireAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  const { error: authError } = await requireAuth();
  if (authError) return Response.json({ error: authError }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return Response.json({ error: "Please upload a PDF, DOCX, DOC, or TXT resume file." }, { status: 400 });
    }

    const filename = file.name || "resume.pdf";
    if (!isSupportedFilename(filename)) {
      return Response.json(
        { error: "Unsupported format. Upload PDF, DOCX, DOC, or TXT." },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({ error: "File must be under 10 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractTextFromBuffer(buffer, filename);
    const resource = await parseResumeWithClaude(rawText);
    const { buffer: docxBuffer, filename: docxFilename } = await buildDevsincDocx(resource);

    return Response.json({
      resource,
      filename: docxFilename,
      docxBase64: docxBuffer.toString("base64"),
      extractedChars: rawText.length,
    });
  } catch (err) {
    console.error("Convert resume error:", err);
    return Response.json(
      { error: err.message ?? "Failed to convert resume." },
      { status: 500 }
    );
  }
}
