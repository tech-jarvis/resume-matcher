"use client";

import { useRef, useState } from "react";
import {
  RESOURCE_FIELDS,
  emptyResource,
  parseCsv,
  mergeResumes,
  saveResumes,
  resetResumes,
} from "@/lib/resumeStorage";
import styles from "./ResumesManager.module.css";

const EDITABLE = RESOURCE_FIELDS.filter((f) => f !== "id");
const isLocalId = (id) => typeof id === "number" && id > 1_000_000_000_000;

async function apiPostResource(resource) {
  const res = await fetch("/api/resources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resource),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.resource;
}

async function apiPatchResource(resource) {
  const res = await fetch(`/api/resources/${resource.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resource),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.resource;
}

async function apiDeleteResource(id) {
  const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
}

export default function ResumesManager({ resumes, onChange, onReload, loading }) {
  const fileRef = useRef(null);
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [msg, setMsg] = useState(null);
  const [filter, setFilter] = useState("");
  const [seeding, setSeeding] = useState(false);

  const filtered = resumes.filter((r) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.primary?.toLowerCase().includes(q) ||
      r.team?.toLowerCase().includes(q) ||
      r.stacks?.toLowerCase().includes(q)
    );
  });

  async function persistResource(resource) {
    if (isLocalId(resource.id)) {
      return apiPostResource(resource);
    }
    return apiPatchResource(resource);
  }

  async function update(id, field, value) {
    const target = resumes.find((r) => r.id === id);
    if (!target) return;
    const updated = { ...target, [field]: value };
    try {
      const saved = await persistResource(updated);
      const next = resumes.map((r) => (r.id === id ? saved : r));
      onChange(next);
      saveResumes(next);
    } catch (e) {
      setMsg(`Save failed: ${e.message}`);
    }
  }

  async function remove(id) {
    try {
      if (!isLocalId(id)) await apiDeleteResource(id);
      const next = resumes.filter((r) => r.id !== id);
      onChange(next);
      saveResumes(next);
      setMsg("Resume removed.");
    } catch (e) {
      setMsg(`Delete failed: ${e.message}`);
    }
  }

  async function addBlank() {
    try {
      const saved = await apiPostResource(emptyResource());
      const next = [...resumes, saved];
      onChange(next);
      saveResumes(next);
      setMsg("Added blank row — fill in the fields below.");
    } catch (e) {
      setMsg(`Add failed: ${e.message}`);
    }
  }

  async function seedCloud() {
    setSeeding(true);
    setMsg(null);
    try {
      const res = await fetch("/api/seed-resources", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`Seeded ${data.seeded} engineers to Supabase.`);
      onReload?.();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSeeding(false);
    }
  }

  function handleReset() {
    if (!confirm("Reset local cache to default roster?")) return;
    const next = resetResumes();
    onChange(next);
    setMsg("Restored local cache.");
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const name = file.name.toLowerCase();
    const isDoc = /\.(pdf|docx|doc|rtf)$/.test(name);

    try {
      let incoming = [];

      if (name.endsWith(".json")) {
        const data = JSON.parse(await file.text());
        incoming = Array.isArray(data) ? data : [data];
      } else if (name.endsWith(".csv")) {
        incoming = parseCsv(await file.text());
      } else if (isDoc) {
        // Binary documents are extracted + parsed server-side, then saved to the pool.
        setParsing(true);
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        incoming = [data.resource];
        setParsing(false);
      } else {
        setParsing(true);
        const res = await fetch("/api/parse-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: await file.text() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        incoming = [data.resource];
        setParsing(false);
      }

      const inserted = [];
      for (const item of incoming) {
        inserted.push(await apiPostResource(item));
      }
      const next = mergeResumes(resumes, inserted);
      onChange(next);
      saveResumes(next);
      setMsg(`Imported ${inserted.length} resume(s) from ${file.name} — saved to the resource pool.`);
      onReload?.();
    } catch (err) {
      setParsing(false);
      setMsg(`Import failed: ${err.message}`);
    }
  }

  async function handlePasteParse() {
    if (!pasteText.trim()) return;
    setParsing(true);
    setMsg(null);
    try {
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const saved = await apiPostResource(data.resource);
      const next = mergeResumes(resumes, [saved]);
      onChange(next);
      saveResumes(next);
      setPasteText("");
      setMsg(`Parsed and added: ${data.resource.name || "New resume"}.`);
      onReload?.();
    } catch (err) {
      setMsg(`Parse failed: ${err.message}`);
    } finally {
      setParsing(false);
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(resumes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devsinc-resumes.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <input
            type="search"
            className={styles.search}
            placeholder="Search by name, team, stack…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <span className={styles.count}>{filtered.length} of {resumes.length} resumes</span>
        </div>
        <div className={styles.toolbarRight}>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.doc,.rtf,.txt,.md,.json,.csv"
            className={styles.fileInput}
            onChange={handleFile}
          />
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
          >
            {parsing ? "Parsing…" : "Upload resume / file"}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={addBlank}>
            + Add row
          </button>
          <button type="button" className={styles.btnSecondary} onClick={exportJson}>
            Export JSON
          </button>
          <button type="button" className={styles.btnGhost} onClick={handleReset}>
            Reset local cache
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={seedCloud}
            disabled={seeding}
          >
            {seeding ? "Seeding…" : "Seed cloud database"}
          </button>
        </div>
      </div>

      {loading && <p className={styles.msg}>Loading resumes from Supabase…</p>}

      <div className={styles.pastePanel}>
        <label className={styles.pasteLabel}>Paste resume text (AI will extract fields)</label>
        <textarea
          className={styles.pasteArea}
          rows={4}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste full resume or LinkedIn profile text here…"
        />
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handlePasteParse}
          disabled={parsing || !pasteText.trim()}
        >
          {parsing ? "Parsing…" : "Parse & add resume"}
        </button>
      </div>

      {msg && <p className={styles.msg}>{msg}</p>}

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              {EDITABLE.map((f) => (
                <th key={f}>{f}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className={styles.idCell}>{r.id}</td>
                {EDITABLE.map((field) => (
                  <td key={field}>
                    <input
                      className={styles.cellInput}
                      value={r[field] ?? ""}
                      onChange={(e) => update(r.id, field, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => remove(r.id)}
                    title="Remove"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
