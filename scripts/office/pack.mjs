#!/usr/bin/env node
/**
 * Repack unpacked OOXML folder to .docx
 * Usage: node scripts/office/pack.mjs unpacked/ output.docx [--original template.docx]
 */
import fs from "fs/promises";
import path from "path";
import JSZip from "jszip";

const args = process.argv.slice(2);
const originalIdx = args.indexOf("--original");
const original = originalIdx >= 0 ? args[originalIdx + 1] : null;
const filtered = args.filter((a, i) => a !== "--original" && (originalIdx < 0 || i !== originalIdx + 1));
const [inputDir, output] = filtered;

if (!inputDir || !output) {
  console.error("Usage: node scripts/office/pack.mjs <unpacked-dir> <output.docx> [--original template.docx]");
  process.exit(1);
}

async function walk(dir, base = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full, base)));
    else files.push(path.relative(base, full));
  }
  return files;
}

const zip = new JSZip();
if (original) {
  const origBuf = await fs.readFile(original);
  const origZip = await JSZip.loadAsync(origBuf);
  for (const [name, file] of Object.entries(origZip.files)) {
    if (!file.dir && !name.startsWith("word/document")) {
      zip.file(name, await file.async("nodebuffer"));
    }
  }
}

const relFiles = await walk(inputDir);
for (const rel of relFiles) {
  const content = await fs.readFile(path.join(inputDir, rel));
  zip.file(rel.replace(/\\/g, "/"), content);
}

const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
await fs.writeFile(output, buffer);
console.log(`Packed ${inputDir} → ${output}`);
