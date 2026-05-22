#!/usr/bin/env node
/**
 * Extract structure from Devsinc template .docx
 * Usage: node scripts/extract-template-structure.mjs [path-to-template.docx]
 */
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { extractTemplateStructure } from "../lib/devsincResumeDocx/extractTemplate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultPath = path.join(
  __dirname,
  "../files/storage/Devsinc_-_Resume_Template_.docx"
);

const docxPath = process.argv[2] || defaultPath;

try {
  const structure = await extractTemplateStructure(docxPath);
  const outPath = path.join(__dirname, "../docs/TEMPLATE_STRUCTURE.json");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(structure, null, 2));
  console.log(JSON.stringify(structure, null, 2));
  console.error(`\nWrote ${outPath}`);
} catch (err) {
  console.error("Extract failed:", err.message);
  console.error(
    "\nPlace the real Google Doc export at:\n  files/storage/Devsinc_-_Resume_Template_.docx\n(File → Download → Microsoft Word (.docx))"
  );
  process.exit(1);
}
