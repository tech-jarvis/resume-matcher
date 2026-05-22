#!/usr/bin/env node
/**
 * Unpack .docx to directory (OOXML zip).
 * Usage: node scripts/office/unpack.mjs input.docx output-dir/
 */
import fs from "fs/promises";
import path from "path";
import JSZip from "jszip";

const [input, outDir] = process.argv.slice(2);
if (!input || !outDir) {
  console.error("Usage: node scripts/office/unpack.mjs <file.docx> <output-dir>");
  process.exit(1);
}

const buf = await fs.readFile(input);
const zip = await JSZip.loadAsync(buf);
await fs.mkdir(outDir, { recursive: true });

for (const [name, file] of Object.entries(zip.files)) {
  if (file.dir) {
    await fs.mkdir(path.join(outDir, name), { recursive: true });
    continue;
  }
  const content = await file.async("nodebuffer");
  const target = path.join(outDir, name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content);
}

console.log(`Unpacked ${input} → ${outDir} (${Object.keys(zip.files).length} entries)`);
