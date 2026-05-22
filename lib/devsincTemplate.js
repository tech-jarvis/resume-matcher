import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** Official Devsinc resume PDF (reference template). */
export const DEVSINC_RESUME_TEMPLATE_PATH = path.join(
  ROOT,
  "files",
  "storage",
  "Devsinc-Resume-Template.pdf"
);

export const DEVSINC_RESUME_TEMPLATE_FILENAME = "Devsinc-Resume-Template.pdf";

export async function readDevsincResumeTemplate() {
  return fs.readFile(DEVSINC_RESUME_TEMPLATE_PATH);
}
