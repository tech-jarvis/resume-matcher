import fs from "node:fs";
import path from "node:path";

const ACTIVE_JSON = path.join(process.cwd(), "files/storage/active-employees.json");

let cachedIndex = null;

function normName(raw) {
  let n = String(raw ?? "").trim();
  n = n.replace(/\s*-\s*ID\s*-\s*\d+\s*$/i, "");
  n = n.replace(/\s*\(\s*\d+\s*\)\s*$/i, "");
  n = n.replace(/\s*\([^)]*\)\s*$/i, "");
  return n.trim();
}

function dedupeKey(name) {
  return normName(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function namesMatch(resourceName, activeName) {
  const a = dedupeKey(resourceName);
  const b = dedupeKey(activeName);
  if (!a || !b) return false;
  if (a === b) return true;

  const resTokens = normName(resourceName).toLowerCase().split(/\s+/).filter(Boolean);
  const actTokens = normName(activeName).toLowerCase().split(/\s+/).filter(Boolean);
  if (actTokens.length === 0) return false;

  // HR name must be reflected in the roster name (handles prefixes like "Malik Omar Tehzeeb")
  return actTokens.every((t) => resTokens.includes(t));
}

function buildIndex(employees) {
  const byId = new Map();
  for (const e of employees) byId.set(e.id, e);
  return { byId, employees };
}

export function loadActiveEmployeeIndex() {
  if (cachedIndex) return cachedIndex;
  if (!fs.existsSync(ACTIVE_JSON)) return null;

  const employees = JSON.parse(fs.readFileSync(ACTIVE_JSON, "utf8"));
  cachedIndex = buildIndex(employees);
  return cachedIndex;
}

export function isActiveEmployee(resource) {
  const index = loadActiveEmployeeIndex();
  if (!index) return true;

  const name = resource?.name;
  if (!name) return false;

  const employeeId = resource?.employeeId ?? resource?.employee_id;
  if (typeof employeeId === "number" && employeeId > 0 && employeeId < 1_000_000) {
    return index.byId.has(employeeId);
  }

  // Default roster uses HR employee ids in `id`. Supabase rows use auto-increment pk
  // in the same field — only treat `id` as HR id when name corroborates it.
  const id = resource?.id;
  if (typeof id === "number" && Number.isInteger(id) && id > 0 && id < 1_000_000) {
    const byId = index.byId.get(id);
    if (byId && namesMatch(name, byId.name)) return true;
  }

  for (const active of index.employees) {
    if (namesMatch(name, active.name)) return true;
  }

  return false;
}

export function filterActiveResources(resources) {
  if (!Array.isArray(resources)) return [];
  const index = loadActiveEmployeeIndex();
  if (!index) return resources;
  return resources.filter(isActiveEmployee);
}
