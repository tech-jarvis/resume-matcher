import { isSupportedFilename } from "@/lib/supportedFormats";

export { isSupportedFilename, supportedExtensions } from "@/lib/supportedFormats";

export async function extractTextFromBuffer(buffer, filename) {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();

  if (ext === ".pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    const text = data.text?.trim();
    if (!text || text.length < 30) {
      throw new Error("Could not extract enough text from PDF. Try a text-based PDF or paste content manually.");
    }
    return text;
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
