import DEFAULT_RESOURCES from "@/lib/resources";

const STORAGE_KEY = "devsinc-resumes";

export const RESOURCE_FIELDS = [
  "id",
  "name",
  "team",
  "designation",
  "primary",
  "stacks",
  "exp",
  "tz",
  "industries",
  "dep",
];

export function emptyResource() {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: "",
    team: "",
    designation: "",
    primary: "",
    stacks: "",
    exp: "",
    tz: "",
    industries: "",
    dep: "",
  };
}

export function loadResumes() {
  if (typeof window === "undefined") return DEFAULT_RESOURCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RESOURCES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RESOURCES;
  } catch {
    return DEFAULT_RESOURCES;
  }
}

export function saveResumes(resumes) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
}

export function resetResumes() {
  if (typeof window === "undefined") return DEFAULT_RESOURCES;
  localStorage.removeItem(STORAGE_KEY);
  return [...DEFAULT_RESOURCES];
}

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row = emptyResource();
    headers.forEach((h, idx) => {
      const val = cols[idx] ?? "";
      if (h === "id" && val) row.id = Number(val) || row.id;
      else if (RESOURCE_FIELDS.includes(h)) row[h] = val;
      else if (h === "experience") row.exp = val;
      else if (h === "timezone") row.tz = val;
      else if (h === "stack" || h === "skills") row.stacks = val;
    });
    if (row.name) rows.push(row);
  }
  return rows;
}

export function mergeResumes(existing, incoming) {
  const byId = new Map(existing.map((r) => [r.id, r]));
  for (const r of incoming) {
    const id = r.id ?? Date.now() + Math.random();
    byId.set(id, { ...emptyResource(), ...r, id });
  }
  return Array.from(byId.values());
}
