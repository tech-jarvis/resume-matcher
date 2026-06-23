"use client";

import { Fragment, useState } from "react";
import styles from "./MatchResultsTable.module.css";

function scoreClass(score) {
  if (score >= 88) return styles.scoreExcellent;
  if (score >= 72) return styles.scoreGood;
  if (score >= 55) return styles.scoreFair;
  return styles.scorePartial;
}

function downloadBase64Docx(base64, filename) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MatchResultsTable({ results, onReset, jd = "", resumes = [] }) {
  const [expanded, setExpanded] = useState({});
  const [tailoringId, setTailoringId] = useState(null);
  const [tailorError, setTailorError] = useState(null);

  if (!results?.matches?.length) return null;

  const toggle = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  async function handleTailor(match) {
    if (tailoringId) return;
    if (!jd || jd.trim().length < 20) {
      setTailorError("The job description is needed to tailor a resume.");
      return;
    }
    const key = match.id ?? match.name;
    setTailoringId(key);
    setTailorError(null);

    // Prefer the full resource from the loaded pool; fall back to the match row.
    const fromPool = resumes.find((r) => r.id === match.id);
    const resource = {
      ...(fromPool || match),
      name: match.name,
      highlights: match.strengths || [],
    };

    try {
      const res = await fetch("/api/tailor-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, jd: jd.trim() }),
      });
      const text = await res.text();
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Unexpected server response. Try again.");
        }
      }
      if (!res.ok) throw new Error(data.error || "Failed to tailor resume.");
      downloadBase64Docx(data.docxBase64, data.filename);
    } catch (e) {
      setTailorError(`${match.name}: ${e.message}`);
    } finally {
      setTailoringId(null);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.summaryBar}>
        <div>
          <p className={styles.summaryLabel}>Analysis</p>
          <p className={styles.summaryText}>{results.summary}</p>
          {results.clusterNote && (
            <p className={styles.clusterNote}>{results.clusterNote}</p>
          )}
        </div>
        <button type="button" className={styles.resetBtn} onClick={onReset}>
          New search
        </button>
      </div>

      <p className={styles.count}>
        {results.matches.length} matches · sorted by score
      </p>

      {tailorError && (
        <div className={styles.errorBox}>
          <strong>Error:</strong> {tailorError}
        </div>
      )}

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Designation</th>
              <th>Team</th>
              <th>Primary</th>
              <th>Exp</th>
              <th>TZ</th>
              <th>Score</th>
              <th>Fit</th>
              <th aria-label="Details" />
            </tr>
          </thead>
          <tbody>
            {results.matches.map((m, i) => {
              const isTop = m.id === results.topPick;
              const open = expanded[m.id ?? i];
              return (
                <Fragment key={m.id ?? i}>
                  <tr
                    className={`${styles.row} ${isTop ? styles.rowTop : ""}`}
                  >
                    <td>{i + 1}</td>
                    <td className={styles.nameCell}>
                      {m.name}
                      {isTop && <span className={styles.topTag}>Top pick</span>}
                    </td>
                    <td>{m.designation}</td>
                    <td>{m.team}</td>
                    <td>{m.primary}</td>
                    <td>{m.exp || "—"}</td>
                    <td>{m.tz}</td>
                    <td>
                      <span className={`${styles.scorePill} ${scoreClass(m.matchScore)}`}>
                        {m.matchScore}
                      </span>
                    </td>
                    <td className={styles.fitCell}>
                      {m.matchScore >= 88
                        ? "Excellent"
                        : m.matchScore >= 72
                          ? "Good"
                          : m.matchScore >= 55
                            ? "Fair"
                            : "Partial"}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.tailorBtn}
                          onClick={() => handleTailor(m)}
                          disabled={tailoringId !== null}
                          title="Tailor this candidate's resume to the JD and download a .docx"
                        >
                          {tailoringId === (m.id ?? m.name) ? (
                            <>
                              <span className={styles.spinner} />
                              Tailoring…
                            </>
                          ) : (
                            "Tailor & download"
                          )}
                        </button>
                        <button
                          type="button"
                          className={styles.expandBtn}
                          onClick={() => toggle(m.id ?? i)}
                          aria-expanded={open}
                        >
                          {open ? "Hide" : "Details"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {open && (
                    <tr className={styles.detailRow}>
                      <td colSpan={10}>
                        <div className={styles.detailGrid}>
                          <div>
                            <strong>Match reason</strong>
                            <p>{m.matchReason}</p>
                          </div>
                          <div>
                            <strong>Stacks</strong>
                            <p>{m.stacks}</p>
                          </div>
                          {m.strengths?.length > 0 && (
                            <div>
                              <strong>Strengths</strong>
                              <ul>
                                {m.strengths.map((s, j) => (
                                  <li key={j}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {m.consideration && (
                            <div>
                              <strong>Consideration</strong>
                              <p>{m.consideration}</p>
                            </div>
                          )}
                          {m.industries && (
                            <div>
                              <strong>Industries</strong>
                              <p>{m.industries}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
