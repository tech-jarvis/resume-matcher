/**
 * Import engineers from the "Devsinc - Resources - By Cluster - Master Sheet.xlsx"
 * into the engineer_resources table (the matcher's resume database).
 *
 * Usage:
 *   node scripts/import-master-sheet.mjs            # dry run: parse + report, writes extracted JSON only
 *   node scripts/import-master-sheet.mjs --write     # upsert into Supabase (insert new names, skip existing)
 *   node scripts/import-master-sheet.mjs --write --overwrite   # update existing rows too
 *   node scripts/import-master-sheet.mjs --include-drafts       # also parse the "Draft" form-response sheets
 *
 * Reads Supabase creds from .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(
  ROOT,
  "files/storage/Devsinc - Resources - By Cluster - Master Sheet.xlsx"
);

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const OVERWRITE = args.includes("--overwrite");
const INCLUDE_DRAFTS = args.includes("--include-drafts");

// ── minimal .env.local loader ───────────────────────────────────────────────
function loadEnv() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return {};
  const env = {};
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

// ── xlsx parsing (sharedStrings + sheets → 2D arrays of strings) ─────────────
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["row", "c", "sheet", "Relationship", "si"].includes(name),
});

function colToIndex(ref) {
  const m = /^([A-Z]+)/.exec(ref || "");
  if (!m) return 0;
  let idx = 0;
  for (const ch of m[1]) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx - 1;
}

function siText(si) {
  // shared string item: either { t } or { r: [{ t }] }
  if (si == null) return "";
  if (typeof si === "string") return si;
  const collect = (node) => {
    if (node == null) return "";
    if (typeof node === "string") return node;
    let out = "";
    if (node.t != null) out += typeof node.t === "string" ? node.t : node.t["#text"] ?? "";
    if (node.r) {
      const runs = Array.isArray(node.r) ? node.r : [node.r];
      for (const run of runs) out += collect(run);
    }
    return out;
  };
  return collect(si);
}

async function parseXlsx(filePath) {
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));

  const shared = [];
  if (zip.file("xl/sharedStrings.xml")) {
    const ss = xmlParser.parse(await zip.file("xl/sharedStrings.xml").async("string"));
    const items = ss.sst?.si || [];
    for (const si of items) shared.push(siText(si));
  }

  const wb = xmlParser.parse(await zip.file("xl/workbook.xml").async("string"));
  const rels = xmlParser.parse(await zip.file("xl/_rels/workbook.xml.rels").async("string"));
  const relMap = {};
  for (const r of rels.Relationships.Relationship) relMap[r["@_Id"]] = r["@_Target"];

  const sheetsMeta = wb.workbook.sheets.sheet.map((s) => ({
    name: s["@_name"],
    rid: s["@_r:id"],
  }));

  const sheets = [];
  for (const { name, rid } of sheetsMeta) {
    let target = relMap[rid];
    if (!target.startsWith("xl/")) target = "xl/" + target.replace(/^\//, "");
    const sheetXml = xmlParser.parse(await zip.file(target).async("string"));
    const rowsXml = sheetXml.worksheet?.sheetData?.row || [];
    const rows = [];
    for (const row of rowsXml) {
      const cells = row.c || [];
      const arr = [];
      for (const c of cells) {
        const idx = colToIndex(c["@_r"]);
        let val = "";
        const t = c["@_t"];
        const v = c.v;
        const raw = v == null ? "" : typeof v === "object" ? v["#text"] ?? "" : v;
        if (t === "s") val = shared[Number(raw)] ?? "";
        else if (t === "inlineStr") val = siText(c.is);
        else val = raw === "" ? "" : String(raw);
        arr[idx] = val;
      }
      rows.push(arr);
    }
    sheets.push({ name, rows });
  }
  return sheets;
}

// ── normalization helpers ────────────────────────────────────────────────────
const clean = (s) => (s == null ? "" : String(s).replace(/\s+/g, " ").trim());

function normName(raw) {
  let n = clean(raw);
  n = n.replace(/\s*-\s*ID\s*-\s*\d+\s*$/i, ""); // "Wardah Arshad - ID - 800"
  n = n.replace(/\s*\(\s*\d+\s*\)\s*$/i, "");
  return n;
}

function isExcelSerialDate(s) {
  // bare numbers in 40000–50000 range are Excel date serials, not real values
  return /^\d{4,5}(\.\d+)?$/.test(s) && Number(s) > 30000 && Number(s) < 60000;
}

function cleanExp(s) {
  const v = clean(s);
  if (!v || isExcelSerialDate(v)) return "";
  return v;
}

function normDep(s) {
  const v = clean(s).toLowerCase();
  if (!v) return "Normal";
  if (v.includes("high")) return "High";
  if (v.includes("low")) return "Low";
  if (v.includes("normal") || v.includes("medium")) return "Normal";
  // team sheets use Availability like "Booked"/"Full Time" here → keep as-is
  return clean(s);
}

const HEADER_MAP = [
  ["name", /^(resource\s+)?name$/i],
  ["team", /^team$/i],
  ["designation", /^designation$/i],
  ["primary", /primary\s+tech\s*stack/i],
  ["stacks", /^(tech\s*stacks|technologies)\b/i],
  ["secondary", /^secondary\s+tech\s*stack/i],
  ["availability", /^availability$/i],
  ["exp", /^(total\s+)?experience$/i],
  ["tz", /preferred\s+time\s*zone|^timezone$|preferred\s+timezone/i],
  ["industries", /^industries\b/i],
  ["dep", /project\s+dependency|^dependency$/i],
];

function buildColMap(headerRow, nextRow) {
  const map = {};
  const apply = (row) => {
    if (!row) return;
    row.forEach((cell, idx) => {
      const text = clean(cell);
      if (!text) return;
      for (const [field, re] of HEADER_MAP) {
        if (map[field] == null && re.test(text)) map[field] = idx;
      }
    });
  };
  apply(headerRow);
  apply(nextRow); // catch vertically-split headers (TOTAL / Experience, etc.)
  return map;
}

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const row = rows[i] || [];
    if (row.some((c) => /^(resource\s+)?name$/i.test(clean(c)))) return i;
  }
  return -1;
}

function extractSheet(sheet) {
  const headerIdx = findHeaderRow(sheet.rows);
  if (headerIdx === -1) return [];
  const colMap = buildColMap(sheet.rows[headerIdx], sheet.rows[headerIdx + 1]);
  if (colMap.name == null) return [];

  // data starts after the header block (1 or 2 header rows)
  const usedTwoRows =
    colMap.exp != null && colMap.exp >= (sheet.rows[headerIdx]?.length || 0) - 1
      ? true
      : false;
  const start = headerIdx + (usedTwoRows ? 2 : 1);

  const out = [];
  for (let i = start; i < sheet.rows.length; i++) {
    const row = sheet.rows[i] || [];
    const name = normName(row[colMap.name]);
    if (!name || /^name$/i.test(name) || isExcelSerialDate(name)) continue;

    const stacks = clean(row[colMap.stacks]);
    const primaryRaw = clean(colMap.primary != null ? row[colMap.primary] : "");
    const primary = primaryRaw || stacks.split(",")[0]?.trim() || "";
    const secondary = clean(colMap.secondary != null ? row[colMap.secondary] : "");
    const allStacks = [stacks, secondary].filter(Boolean).join(", ");

    // need at least some skill signal or designation to be a real person row
    if (!stacks && !primary && !clean(row[colMap.designation])) continue;

    out.push({
      name,
      team: clean(colMap.team != null ? row[colMap.team] : "") || sheet.name,
      designation: clean(colMap.designation != null ? row[colMap.designation] : ""),
      primary,
      stacks: allStacks || primary,
      exp: cleanExp(colMap.exp != null ? row[colMap.exp] : ""),
      tz: clean(colMap.tz != null ? row[colMap.tz] : "") || "Anytime",
      industries: clean(colMap.industries != null ? row[colMap.industries] : ""),
      dep: normDep(colMap.dep != null ? row[colMap.dep] : ""),
      _sheet: sheet.name,
    });
  }
  return out;
}

function dedupeKey(name) {
  return normName(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mergeRecords(a, b) {
  const pick = (x, y) => (clean(x).length >= clean(y).length ? x : y);
  const mergeList = (x, y) => {
    const set = new Map();
    for (const part of `${x || ""}, ${y || ""}`.split(",")) {
      const p = clean(part);
      if (p) set.set(p.toLowerCase(), p);
    }
    return [...set.values()].join(", ");
  };
  return {
    name: a.name,
    team: a.team || b.team,
    designation: pick(a.designation, b.designation),
    primary: a.primary || b.primary,
    stacks: mergeList(a.stacks, b.stacks),
    exp: pick(a.exp, b.exp),
    tz: a.tz && a.tz !== "Anytime" ? a.tz : b.tz || a.tz,
    industries: mergeList(a.industries, b.industries),
    dep: a.dep !== "Normal" ? a.dep : b.dep,
  };
}

async function main() {
  const sheets = await parseXlsx(XLSX_PATH);

  const skipSheet = (name) =>
    /^\d+(\s*\(\d+\))?$/.test(name.trim()) || // template sheets named "2", "2 (1)" ...
    (!INCLUDE_DRAFTS && /^draft/i.test(name.trim()));

  const perSheet = [];
  const byKey = new Map();

  for (const sheet of sheets) {
    if (skipSheet(sheet.name)) {
      perSheet.push({ sheet: sheet.name, extracted: 0, skipped: true });
      continue;
    }
    const records = extractSheet(sheet);
    perSheet.push({ sheet: sheet.name, extracted: records.length });
    for (const rec of records) {
      const key = dedupeKey(rec.name);
      if (!key) continue;
      byKey.set(key, byKey.has(key) ? mergeRecords(byKey.get(key), rec) : rec);
    }
  }

  const people = [...byKey.values()].map((p) => {
    const { _sheet, ...rest } = p;
    return rest;
  });
  people.sort((a, b) => a.name.localeCompare(b.name));

  console.log("\n── Per-sheet extraction ──");
  for (const s of perSheet) {
    console.log(
      `  ${s.skipped ? "[skip] " : "       "}${s.sheet.padEnd(20)} ${s.extracted ?? 0}`
    );
  }
  console.log(`\nUnique people after dedupe: ${people.length}`);

  const outPath = path.join(ROOT, "files/storage/master-sheet-extracted.json");
  fs.writeFileSync(outPath, JSON.stringify(people, null, 2));
  console.log(`Wrote normalized JSON → ${path.relative(ROOT, outPath)}`);

  if (!WRITE) {
    console.log("\n(dry run — pass --write to upsert into engineer_resources)\n");
    return;
  }

  // ── write to Supabase ──
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: existing, error: exErr } = await supabase
    .from("engineer_resources")
    .select("id, name");
  if (exErr) throw exErr;

  const existingByKey = new Map();
  for (const r of existing || []) existingByKey.set(dedupeKey(r.name), r);
  console.log(`\nExisting rows in DB: ${existing?.length ?? 0}`);

  const toInsert = [];
  const toUpdate = [];
  for (const p of people) {
    const row = {
      name: p.name,
      team: p.team,
      designation: p.designation,
      primary_stack: p.primary,
      stacks: p.stacks,
      exp: p.exp,
      tz: p.tz,
      industries: p.industries,
      dep: p.dep || "Normal",
      user_id: null,
    };
    const hit = existingByKey.get(dedupeKey(p.name));
    if (hit) {
      if (OVERWRITE) toUpdate.push({ id: hit.id, row });
    } else {
      toInsert.push(row);
    }
  }

  console.log(`To insert (new names): ${toInsert.length}`);
  console.log(`To update (existing):  ${OVERWRITE ? toUpdate.length : 0}${OVERWRITE ? "" : " (skipped — pass --overwrite)"}`);

  // batch insert
  for (let i = 0; i < toInsert.length; i += 200) {
    const batch = toInsert.slice(i, i + 200);
    const { error } = await supabase.from("engineer_resources").insert(batch);
    if (error) throw error;
    console.log(`  inserted ${Math.min(i + batch.length, toInsert.length)}/${toInsert.length}`);
  }

  if (OVERWRITE) {
    for (const { id, row } of toUpdate) {
      const { error } = await supabase.from("engineer_resources").update(row).eq("id", id);
      if (error) throw error;
    }
    console.log(`  updated ${toUpdate.length} existing rows`);
  }

  const { count } = await supabase
    .from("engineer_resources")
    .select("*", { count: "exact", head: true });
  console.log(`\nDone. engineer_resources now has ${count} rows.\n`);
}

main().catch((e) => {
  console.error("Import failed:", e.message);
  process.exit(1);
});
