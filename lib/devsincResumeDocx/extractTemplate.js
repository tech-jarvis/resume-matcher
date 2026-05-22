import fs from "fs/promises";
import path from "path";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
});

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

function twipsToPt(twips) {
  if (!twips) return null;
  return Math.round((Number(twips) / 20) * 10) / 10;
}

/**
 * Extract structure from Devsinc template .docx (OOXML).
 * @param {string} docxPath
 */
export async function extractTemplateStructure(docxPath) {
  const buf = await fs.readFile(docxPath);
  if (buf[0] === 0x3c || buf.toString("utf8", 0, 20).includes("<!DOCTYPE")) {
    throw new Error(
      "File is not a valid .docx (got HTML). Export the Google Doc as Word (.docx) and save to files/storage/Devsinc_-_Resume_Template_.docx"
    );
  }

  const zip = await JSZip.loadAsync(buf);
  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) throw new Error("Invalid docx: missing word/document.xml");

  const doc = parser.parse(documentXml);
  const body = doc.document?.body ?? doc.body ?? doc;

  const paragraphs = collect(body, "p");
  const tables = collect(body, "tbl");
  const texts = [];
  const fonts = new Set();
  const colors = new Set();
  const sizes = new Set();
  const sectionHeadings = [];

  for (const p of paragraphs) {
    const runs = collect(p, "r");
    let line = "";
    for (const r of runs) {
      const t = r.t;
      const text = typeof t === "string" ? t : t?.["#text"] ?? "";
      line += text;
      const rPr = r.rPr;
      if (rPr?.rFonts?.["@_ascii"]) fonts.add(rPr.rFonts["@_ascii"]);
      if (rPr?.color?.["@_val"]) colors.add(rPr.color["@_val"]);
      if (rPr?.sz?.["@_val"]) sizes.add(rPr.sz["@_val"]);
    }
    const trimmed = line.trim();
    if (trimmed) texts.push(trimmed);
    if (/^(WORK EXPERIENCE|CONTACT|SKILLS|ACHIEVEMENTS|PROJECTS|CERTIFICATES|EDUCATION)$/i.test(trimmed)) {
      sectionHeadings.push(trimmed);
    }
  }

  const tableInfo = [];
  for (const tbl of tables) {
    const grid = tbl.tblGrid?.gridCol;
    const cols = grid ? (Array.isArray(grid) ? grid : [grid]) : [];
    const widths = cols.map((c) => Number(c["@_w"])).filter(Boolean);
    const cells = collect(tbl, "tc");
    const shadings = cells
      .map((tc) => tc.tcPr?.shd?.["@_fill"])
      .filter(Boolean);
    tableInfo.push({ columnWidthsDxa: widths, cellShading: [...new Set(shadings)] });
  }

  const sectPr = body.sectPr ?? collect(body, "sectPr")[0];
  const pgSz = sectPr?.pgSz;
  const pgMar = sectPr?.pgMar;

  return {
    source: path.basename(docxPath),
    page: {
      widthDxa: pgSz?.["@_w"] ? Number(pgSz["@_w"]) : null,
      heightDxa: pgSz?.["@_h"] ? Number(pgSz["@_h"]) : null,
      widthPt: twipsToPt(pgSz?.["@_w"]),
      heightPt: twipsToPt(pgSz?.["@_h"]),
      marginsDxa: pgMar
        ? {
            top: Number(pgMar["@_top"]),
            right: Number(pgMar["@_right"]),
            bottom: Number(pgMar["@_bottom"]),
            left: Number(pgMar["@_left"]),
          }
        : null,
    },
    tables: tableInfo,
    twoColumnLayout: tableInfo.some(
      (t) =>
        t.columnWidthsDxa?.length === 2 &&
        t.columnWidthsDxa[0] + t.columnWidthsDxa[1] === 9360
    ),
    fonts: [...fonts],
    colors: [...colors],
    fontSizesHalfPt: [...sizes].map(Number).sort((a, b) => a - b),
    sectionHeadings,
    sampleText: texts.slice(0, 25),
    paragraphCount: paragraphs.length,
    findings: buildFindings(tableInfo, pgSz, pgMar, fonts, colors, sizes, sectionHeadings),
  };
}

function buildFindings(tables, pgSz, pgMar, fonts, colors, sizes, sections) {
  const lines = [];
  if (pgSz) {
    lines.push(
      `Page size: ${pgSz["@_w"]} x ${pgSz["@_h"]} DXA (${twipsToPt(pgSz["@_w"])} x ${twipsToPt(pgSz["@_h"])} pt)`
    );
  }
  if (pgMar) {
    lines.push(
      `Margins: top ${pgMar["@_top"]} right ${pgMar["@_right"]} bottom ${pgMar["@_bottom"]} left ${pgMar["@_left"]} DXA`
    );
  }
  for (const t of tables) {
    lines.push(`Table columns (DXA): ${t.columnWidthsDxa?.join(" + ") || "unknown"}`);
    if (t.cellShading?.length) lines.push(`Cell shading fills: ${t.cellShading.join(", ")}`);
  }
  if (fonts.size) lines.push(`Fonts: ${[...fonts].join(", ")}`);
  if (colors.size) lines.push(`Text/fill colors: ${[...colors].join(", ")}`);
  if (sizes.size) lines.push(`Font sizes (half-pt): ${[...sizes].join(", ")}`);
  if (sections.length) lines.push(`Section headings: ${sections.join(", ")}`);
  return lines;
}
