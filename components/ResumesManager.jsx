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

export default function ResumesManager({ resumes, onChange }) {
  const fileRef = useRef(null);
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [msg, setMsg] = useState(null);
  const [filter, setFilter] = useState("");

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

  function update(id, field, value) {
    const next = resumes.map((r) =>
      r.id === id ? { ...r, [field]: value } : r
    );
    onChange(next);
    saveResumes(next);
  }

  function remove(id) {
    const next = resumes.filter((r) => r.id !== id);
    onChange(next);
    saveResumes(next);
    setMsg("Resume removed.");
  }

  function addBlank() {
    const next = [...resumes, emptyResource()];
    onChange(next);
    saveResumes(next);
    setMsg("Added blank row — fill in the fields below.");
  }

  function handleReset() {
    if (!confirm("Reset all resumes to the default Devsinc roster? Custom entries will be lost.")) return;
    const next = resetResumes();
    onChange(next);
    setMsg("Restored default engineer roster.");
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const text = await file.text();
      let incoming = [];

      if (file.name.endsWith(".json")) {
        const data = JSON.parse(text);
        incoming = Array.isArray(data) ? data : [data];
      } else if (file.name.endsWith(".csv")) {
        incoming = parseCsv(text);
      } else {
        setParsing(true);
        const res = await fetch("/api/parse-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        incoming = [data.resource];
        setParsing(false);
      }

      const next = mergeResumes(resumes, incoming);
      onChange(next);
      saveResumes(next);
      setMsg(`Imported ${incoming.length} resume(s) from ${file.name}.`);
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
      const next = mergeResumes(resumes, [data.resource]);
      onChange(next);
      saveResumes(next);
      setPasteText("");
      setMsg(`Parsed and added: ${data.resource.name || "New resume"}.`);
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
            accept=".json,.csv,.txt,.md"
            className={styles.fileInput}
            onChange={handleFile}
          />
          <button type="button" className={styles.btnSecondary} onClick={() => fileRef.current?.click()}>
            Upload file
          </button>
          <button type="button" className={styles.btnSecondary} onClick={addBlank}>
            + Add row
          </button>
          <button type="button" className={styles.btnSecondary} onClick={exportJson}>
            Export JSON
          </button>
          <button type="button" className={styles.btnGhost} onClick={handleReset}>
            Reset defaults
          </button>
        </div>
      </div>

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
