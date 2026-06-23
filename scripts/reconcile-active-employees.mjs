/**
 * Reconcile matcher roster against HR active employee list.
 *
 * Usage:
 *   node scripts/reconcile-active-employees.mjs [pdf-path]           # dry run
 *   node scripts/reconcile-active-employees.mjs [pdf-path] --write   # apply changes
 *
 * Updates:
 *   - files/storage/active-employees.json
 *   - lib/resources.js (default roster)
 *   - files/storage/master-sheet-extracted.json
 *   - engineer_resources in Supabase (deletes inactive by name)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const WRITE = process.argv.includes("--write");
const PDF_PATH =
  args[0] ||
  path.join(ROOT, "files/storage/active-employees-2026-06-23.pdf");

const ACTIVE_JSON = path.join(ROOT, "files/storage/active-employees.json");
const RESOURCES_JS = path.join(ROOT, "lib/resources.js");
const MASTER_JSON = path.join(ROOT, "files/storage/master-sheet-extracted.json");

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

function normName(raw) {
  let n = String(raw ?? "").trim();
  n = n.replace(/\s*-\s*ID\s*-\s*\d+\s*$/i, "");
  n = n.replace(/\s*\(\s*\d+\s*\)\s*$/i, "");
  n = n.replace(/\s*\([^)]*\)\s*$/i, ""); // "(CRM)" suffixes in roster
  return n.trim();
}

function dedupeKey(name) {
  return normName(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

const DESIGNATION_START =
  /\s+(Associate|Assistant|Chief|Team Lead|Senior|Software|SQA|Data Analyst|Data|Principal|Head of|Head|Director|VP|Sr\.|Trainee|Product Lead|Service Analyst|ATL|TL -|Manager|Solution|Functional|Technical|3D Artist|Salesforce|Trainee)/i;

function splitNameAndDesignation(middle) {
  const m = middle.match(DESIGNATION_START);
  if (m?.index != null && m.index > 0) {
    return {
      name: middle.slice(0, m.index).trim(),
      designation: middle.slice(m.index).trim(),
    };
  }
  return { name: middle.trim(), designation: "" };
}

function namesMatch(resourceName, activeName) {
  const a = dedupeKey(resourceName);
  const b = dedupeKey(activeName);
  if (!a || !b) return false;
  if (a === b) return true;

  const resTokens = normName(resourceName).toLowerCase().split(/\s+/).filter(Boolean);
  const actTokens = normName(activeName).toLowerCase().split(/\s+/).filter(Boolean);
  if (actTokens.length === 0) return false;

  return actTokens.every((t) => resTokens.includes(t));
}

async function parseActiveEmployeesPdf(pdfPath) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const buf = fs.readFileSync(pdfPath);
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: false });
  const merged = (Array.isArray(text) ? text : [text]).join("\n");

  const employees = [];
  for (const line of merged.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || /^--\s*\d+\s+of\s+\d+\s*--$/i.test(trimmed)) continue;
    if (/^id\s+full name/i.test(trimmed)) continue;

    const m = trimmed.match(/^(\d+)\s+(.+)\s+([\w.+-]+@devsinc\.com)\s*$/i);
    if (!m) continue;

    const [, idStr, middle, email] = m;
    const { name, designation } = splitNameAndDesignation(middle);
    employees.push({
      id: Number(idStr),
      name,
      designation,
      email: email.trim().toLowerCase(),
    });
  }

  if (employees.length < 100) {
    throw new Error(
      `Only parsed ${employees.length} employees from PDF — check format or path: ${pdfPath}`
    );
  }

  return employees;
}

function buildActiveIndex(employees) {
  const byId = new Map();
  const byNameKey = new Map();
  const byEmail = new Map();

  for (const e of employees) {
    byId.set(e.id, e);
    byEmail.set(e.email, e);
    const key = dedupeKey(e.name);
    if (!byNameKey.has(key)) byNameKey.set(key, []);
    byNameKey.get(key).push(e);
  }

  return { byId, byNameKey, byEmail, employees };
}

function isActiveResource(resource, index) {
  const id = resource.id;
  if (typeof id === "number" && Number.isInteger(id) && id > 0 && id < 1_000_000) {
    return index.byId.has(id);
  }

  for (const active of index.employees) {
    if (namesMatch(resource.name, active.name)) return true;
  }

  return false;
}

async function loadDefaultResources() {
  const mod = await import(path.join(ROOT, "lib/resources.js"));
  return mod.default;
}

function formatResourceLine(r) {
  const fields = [
    `id: ${typeof r.id === "number" ? r.id : JSON.stringify(r.id)}`,
    `name: ${JSON.stringify(r.name)}`,
    `team: ${JSON.stringify(r.team ?? "")}`,
    `designation: ${JSON.stringify(r.designation ?? "")}`,
    `primary: ${JSON.stringify(r.primary ?? "")}`,
    `stacks: ${JSON.stringify(r.stacks ?? "")}`,
    `exp: ${JSON.stringify(r.exp ?? "")}`,
    `tz: ${JSON.stringify(r.tz ?? "")}`,
    `industries: ${JSON.stringify(r.industries ?? "")}`,
    `dep: ${JSON.stringify(r.dep ?? "Normal")}`,
  ];
  return `  { ${fields.join(", ")} }`;
}

function writeResourcesJs(resources) {
  const lines = resources.map((r) => `${formatResourceLine(r)},`);
  const body = `// lib/resources.js — Active Devsinc engineer profiles (reconciled against HR roster)

const RESOURCES = [
${lines.join("\n")}
];

export default RESOURCES;
`;
  fs.writeFileSync(RESOURCES_JS, body);
}

async function reconcileSupabase(index) {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log("\nSkipping Supabase (missing .env.local credentials).");
    return { skipped: true };
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: rows, error } = await supabase.from("engineer_resources").select("id, name");
  if (error) throw error;

  const toDelete = (rows ?? []).filter((r) => !isActiveResource({ name: r.name }, index));
  console.log(`\nSupabase engineer_resources: ${rows?.length ?? 0} rows`);
  console.log(`  to delete (inactive): ${toDelete.length}`);

  if (!WRITE || toDelete.length === 0) return { deleted: 0, kept: (rows?.length ?? 0) - toDelete.length };

  for (let i = 0; i < toDelete.length; i += 100) {
    const batch = toDelete.slice(i, i + 100);
    const ids = batch.map((r) => r.id);
    const { error: delErr } = await supabase.from("engineer_resources").delete().in("id", ids);
    if (delErr) throw delErr;
    console.log(`  deleted ${Math.min(i + batch.length, toDelete.length)}/${toDelete.length}`);
  }

  return { deleted: toDelete.length, kept: (rows?.length ?? 0) - toDelete.length };
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    throw new Error(`PDF not found: ${PDF_PATH}`);
  }

  console.log(`Parsing active employees from:\n  ${PDF_PATH}`);
  const employees = await parseActiveEmployeesPdf(PDF_PATH);
  const index = buildActiveIndex(employees);
  console.log(`Active employees: ${employees.length} (${index.byId.size} unique IDs)`);

  const allResources = await loadDefaultResources();
  const kept = allResources.filter((r) => isActiveResource(r, index));
  const removed = allResources.filter((r) => !isActiveResource(r, index));

  console.log(`\nlib/resources.js: ${allResources.length} → ${kept.length} (removing ${removed.length})`);
  if (removed.length) {
    console.log("  Removed:");
    for (const r of removed) console.log(`    - [${r.id}] ${r.name}`);
  }

  let masterRemoved = 0;
  let masterKept = 0;
  let masterFiltered = [];
  if (fs.existsSync(MASTER_JSON)) {
    const master = JSON.parse(fs.readFileSync(MASTER_JSON, "utf8"));
    masterFiltered = master.filter((r) => isActiveResource(r, index));
    masterRemoved = master.length - masterFiltered.length;
    masterKept = masterFiltered.length;
    console.log(`\nmaster-sheet-extracted.json: ${master.length} → ${masterKept} (removing ${masterRemoved})`);

    if (WRITE) {
      fs.writeFileSync(MASTER_JSON, JSON.stringify(masterFiltered, null, 2));
    }
  }

  const dbResult = await reconcileSupabase(index);

  if (WRITE) {
    fs.writeFileSync(ACTIVE_JSON, JSON.stringify(employees, null, 2));
    writeResourcesJs(kept);
    console.log(`\nWrote ${path.relative(ROOT, ACTIVE_JSON)}`);
    console.log(`Wrote ${path.relative(ROOT, RESOURCES_JS)}`);
  } else {
    console.log("\n(dry run — pass --write to apply changes)");
  }

  console.log("\nDone.");
  return { employees: employees.length, kept: kept.length, removed: removed.length, dbResult };
}

main().catch((e) => {
  console.error("Reconcile failed:", e.message);
  process.exit(1);
});
