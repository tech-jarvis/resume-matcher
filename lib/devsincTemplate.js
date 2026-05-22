import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** Official Devsinc resume Word template (primary). */
export const DEVSINC_RESUME_TEMPLATE_DOCX_PATH = path.join(
  ROOT,
  "files",
  "storage",
  "Devsinc_-_Resume_Template_.docx"
);

/** PDF reference copy. */
export const DEVSINC_RESUME_TEMPLATE_PATH = path.join(
  ROOT,
  "files",
  "storage",
  "Devsinc-Resume-Template.pdf"
);

export const DEVSINC_RESUME_TEMPLATE_FILENAME = "Devsinc_-_Resume_Template_.docx";

export async function readDevsincResumeTemplate() {
  return fs.readFile(DEVSINC_RESUME_TEMPLATE_PATH);
}
