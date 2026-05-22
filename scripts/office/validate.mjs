#!/usr/bin/env node
/**
 * Validate generated Devsinc resume .docx (Vercel-safe, no Python).
 * Usage: node scripts/office/validate.mjs output.docx
 */
import fs from "fs/promises";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { TABLE } from "../../lib/devsincResumeDocx/constants.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/office/validate.mjs <file.docx>");
  process.exit(1);
}

const errors = [];
const warnings = [];

function collect(node, tag, out = []) {
  if (!node || typeof node !== "object") return out;
  if (node[tag]) {
    const items = Array.isArray(node[tag]) ? node[tag] : [node[tag]];
    out.push(...items);
  }
  for (const key of Object.keys(node)) {
    if (key.startsWith("@_")) continue;
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => collect(c, tag, out));
    else if (typeof child === "object") collect(child, tag, out);
  }
  return out;
}

try {
  const buf = await fs.readFile(file);
  if (buf[0] === 0x3c) {
    errors.push("File is HTML, not a ZIP/docx");
    throw new Error("invalid");
  }

  const zip = await JSZip.loadAsync(buf);
  const required = [
    "[Content_Types].xml",
    "word/document.xml",
    "word/_rels/document.xml.rels",
  ];
  for (const r of required) {
    if (!zip.file(r)) errors.push(`Missing ${r}`);
  }

  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) {
    errors.push("Empty document.xml");
  } else {
    if (documentXml.includes("\0")) errors.push("document.xml contains null bytes");
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      removeNSPrefix: true,
    });
    let parsed;
    try {
      parsed = parser.parse(documentXml);
    } catch (e) {
      errors.push(`document.xml parse error: ${e.message}`);
    }

    if (parsed) {
      const body = parsed.document?.body ?? parsed.body;
      const tables = collect(body, "tbl");
      if (tables.length === 0) {
        errors.push("No table found (expected two-column layout table)");
      } else {
        const tbl = tables[0];
        const grid = tbl.tblGrid?.gridCol;
        const cols = grid ? (Array.isArray(grid) ? grid : [grid]) : [];
        const widths = cols.map((c) => Number(c["@_w"]));
        const sum = widths.reduce((a, b) => a + b, 0);
        if (widths[0] !== TABLE.leftCol || widths[1] !== TABLE.rightCol) {
          warnings.push(
            `Column widths ${widths.join("+")} DXA — expected ${TABLE.leftCol}+${TABLE.rightCol}`
          );
        }
        if (sum !== TABLE.width) {
          errors.push(`Column sum ${sum} !== ${TABLE.width} DXA`);
        }
        const cells = collect(tbl, "tc");
        for (const tc of cells) {
          const shd = tc.tcPr?.shd;
          if (shd?.["@_fill"] === "000000" || shd?.["@_val"] === "solid") {
            warnings.push("Cell may have solid black shading — use ShadingType.CLEAR");
          }
        }
      }

      const numbering = await zip.file("word/numbering.xml")?.async("string");
      if (!numbering?.includes("LevelFormat") && !numbering?.includes("num")) {
        warnings.push("numbering.xml: bullet numbering may be missing");
      }

      const sectPr = body?.sectPr ?? collect(body, "sectPr")[0];
      const pgSz = sectPr?.pgSz;
      if (pgSz) {
        const w = Number(pgSz["@_w"]);
        const h = Number(pgSz["@_h"]);
        if (w !== 12240 || h !== 15840) {
          warnings.push(`Page size ${w}x${h} DXA — expected 12240x15840 (US Letter)`);
        }
      }
    }
  }
} catch (e) {
  if (e.message !== "invalid") errors.push(e.message);
}

if (warnings.length) {
  console.warn("Warnings:");
  warnings.forEach((w) => console.warn("  -", w));
}

if (errors.length) {
  console.error("Validation FAILED:");
  errors.forEach((e) => console.error("  -", e));
  process.exit(1);
}

console.log(`Validation OK: ${file}`);
process.exit(0);
