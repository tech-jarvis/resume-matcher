export const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt", ".md", ".rtf"];

export function supportedExtensions() {
  return SUPPORTED_EXTENSIONS;
}

export function isSupportedFilename(filename) {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}
