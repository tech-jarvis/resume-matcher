import { isSupportedFilename } from "@/lib/supportedFormats";

export { isSupportedFilename, supportedExtensions } from "@/lib/supportedFormats";

async function extractPdfText(buffer) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const merged = Array.isArray(text) ? text.join("\n") : String(text ?? "").trim();
  const trimmed = merged.trim();
  if (!trimmed || trimmed.length < 30) {
    throw new Error(
      "Could not extract enough text from PDF. Try a text-based PDF or paste content manually."
    );
  }
  return trimmed;
}

export async function extractTextFromBuffer(buffer, filename) {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();

  if (ext === ".pdf") {
    return extractPdfText(buffer);
  }

  if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value?.trim();
    if (!text || text.length < 30) {
      throw new Error("Could not extract enough text from DOCX file.");
    }
    return text;
  }

  if (ext === ".doc") {
    const WordExtractor = (await import("word-extractor")).default;
    const extractor = new WordExtractor();
    const doc = await extractor.extract(buffer);
    const text = [doc.getBody(), doc.getFootnotes(), doc.getEndnotes()]
      .filter(Boolean)
      .join("\n")
      .trim();
    if (!text || text.length < 30) {
      throw new Error("Could not extract enough text from DOC file.");
    }
    return text;
  }

  if ([".txt", ".md", ".rtf"].includes(ext)) {
    const text = buffer.toString("utf-8").trim();
    if (text.length < 20) throw new Error("File appears empty or too short.");
    return text;
  }

  throw new Error(`Unsupported file type "${ext}". Use PDF, DOCX, DOC, or TXT.`);
}
