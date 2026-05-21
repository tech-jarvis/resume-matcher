"use client";

import { useState } from "react";
import styles from "./ResourceMatcher.module.css";
import RESOURCES from "@/lib/resources";

const TOTAL = RESOURCES.length;

function initials(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  ["#dbeafe", "#1d4ed8"],
  ["#dcfce7", "#15803d"],
  ["#fef3c7", "#b45309"],
  ["#fce7f3", "#be185d"],
  ["#ede9fe", "#6d28d9"],
  ["#ccfbf1", "#0f766e"],
];

function scoreLabel(s) {
  if (s >= 88) return { label: "Excellent", color: "var(--success)", bg: "var(--success-bg)" };
  if (s >= 72) return { label: "Good",      color: "var(--accent)",  bg: "var(--accent-bg)" };
  if (s >= 55) return { label: "Fair",      color: "var(--warn)",    bg: "var(--warn-bg)"   };
  return             { label: "Partial",    color: "var(--danger)",  bg: "var(--danger-bg)" };
}

function Tag({ children, accent }) {
  return (
    <span
      className={styles.tag}
      style={accent ? { background: "var(--accent-bg)", color: "var(--accent-t)", borderColor: "transparent" } : {}}
    >
      {children}
    </span>
  );
}

function MatchCard({ match, index, isTop }) {
  const [open, setOpen] = useState(isTop);
  const { label, color, bg } = scoreLabel(match.matchScore);
  const [avatarBg, avatarFg] = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <div className={`${styles.card} ${isTop ? styles.cardTop : ""}`} style={{ animationDelay: `${index * 60}ms` }}>
      {isTop && <div className={styles.topBadge}>⭐ Top pick</div>}

      <div className={styles.cardHeader} onClick={() => setOpen((o) => !o)}>
        <div className={styles.avatar} style={{ background: avatarBg, color: avatarFg }}>
          {initials(match.name)}
        </div>

        <div className={styles.cardMeta}>
          <div className={styles.cardName}>
            {match.name}
            <span className={styles.desig}>{match.designation}</span>
          </div>
          <div className={styles.cardSub}>
            {match.team} · {match.exp || "—"} exp · {match.tz}
          </div>
        </div>

        <div className={styles.scoreBlock} style={{ background: bg, color }}>
          <span className={styles.scoreNum}>{match.matchScore}</span>
          <span className={styles.scoreLabel}>{label}</span>
        </div>

        <button className={styles.chevron} aria-label="toggle">
          {open ? "▲" : "▼"}
        </button>
      </div>

      {open && (
        <div className={styles.cardBody}>
          <p className={styles.reason}>{match.matchReason}</p>

          <div className={styles.tagRow}>
            {match.primary && <Tag accent>{match.primary}</Tag>}
            {match.stacks
              ?.split(",")
              .slice(0, 7)
              .filter((s) => s.trim() !== match.primary)
              .map((s, i) => <Tag key={i}>{s.trim()}</Tag>)}
          </div>

          {match.strengths?.length > 0 && (
            <ul className={styles.strengths}>
              {match.strengths.map((s, i) => (
                <li key={i}>
                  <span className={styles.check}>✓</span> {s}
                </li>
              ))}
            </ul>
          )}

          {match.consideration && (
            <p className={styles.consideration}>
              <span>ℹ</span> {match.consideration}
            </p>
          )}

          {match.industries && (
            <p className={styles.industries}>🏢 {match.industries}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResourceMatcher() {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  async function handleMatch() {
    if (!jd.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Unexpected error");
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.shell}>
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>D</span>
          <span className={styles.logoText}>Devsinc</span>
        </div>
        <nav className={styles.nav}>
          <a className={`${styles.navItem} ${styles.navActive}`}>🔍 Resource Matcher</a>
        </nav>
        <div className={styles.sideStats}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{TOTAL}</span>
            <span className={styles.statLabel}>Engineers</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>14</span>
            <span className={styles.statLabel}>Clusters</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>15+</span>
            <span className={styles.statLabel}>Tech stacks</span>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <h1 className={styles.pageTitle}>Resource Matcher</h1>
          <p className={styles.pageDesc}>Paste a JD or client requirement — get ranked engineer profiles back in seconds.</p>
        </div>

        {/* Input panel */}
        <div className={styles.panel}>
          <label className={styles.label} htmlFor="jd-input">
            Job description / client requirement
          </label>
          <textarea
            id="jd-input"
            className={styles.jdInput}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleMatch(); }}
            placeholder="e.g. We need a senior React developer with 4+ years of experience, strong Node.js skills, and familiarity with AWS. Healthcare domain experience is a plus. EST timezone preferred..."
            rows={7}
          />
          <div className={styles.inputFooter}>
            <span className={styles.hint}>⌘ Enter to match</span>
            <button
              className={`${styles.matchBtn} ${loading ? styles.matchBtnLoading : ""}`}
              onClick={handleMatch}
              disabled={loading || !jd.trim()}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Matching…
                </>
              ) : (
                "Find best matches →"
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className={styles.results}>
            {/* Summary bar */}
            <div className={styles.summaryBar}>
              <div className={styles.summaryText}>
                <p className={styles.summaryLabel}>Analysis</p>
                <p>{results.summary}</p>
                {results.clusterNote && (
                  <p className={styles.clusterNote}>🏢 {results.clusterNote}</p>
                )}
              </div>
              <button
                className={styles.resetBtn}
                onClick={() => { setResults(null); setJd(""); }}
              >
                New search
              </button>
            </div>

            <div className={styles.resultCount}>
              {results.matches?.length} matches found
            </div>

            <div className={styles.matchList}>
              {results.matches?.map((m, i) => (
                <MatchCard
                  key={m.id ?? i}
                  match={m}
                  index={i}
                  isTop={m.id === results.topPick}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
