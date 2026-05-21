"use client";

import { Fragment, useState } from "react";
import styles from "./MatchResultsTable.module.css";

function scoreClass(score) {
  if (score >= 88) return styles.scoreExcellent;
  if (score >= 72) return styles.scoreGood;
  if (score >= 55) return styles.scoreFair;
  return styles.scorePartial;
}

export default function MatchResultsTable({ results, onReset }) {
  const [expanded, setExpanded] = useState({});

  if (!results?.matches?.length) return null;

  const toggle = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

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
                      <button
                        type="button"
                        className={styles.expandBtn}
                        onClick={() => toggle(m.id ?? i)}
                        aria-expanded={open}
                      >
                        {open ? "Hide" : "Details"}
                      </button>
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
