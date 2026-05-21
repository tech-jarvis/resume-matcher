"use client";

import { useEffect, useState } from "react";
import styles from "./ResourceMatcher.module.css";
import { loadResumes, saveResumes } from "@/lib/resumeStorage";
import MatchResultsTable from "./MatchResultsTable";
import ResumesManager from "./ResumesManager";
import ResumeConverter from "./ResumeConverter";

export default function ResourceMatcher() {
  const [tab, setTab] = useState("match");
  const [resumes, setResumes] = useState([]);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setResumes(loadResumes());
  }, []);

  function handleResumesChange(next) {
    setResumes(next);
    saveResumes(next);
  }

  async function handleMatch() {
    if (!jd.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd, resources: resumes }),
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

  const clusters = new Set(resumes.map((r) => r.team).filter(Boolean)).size;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <a href="https://www.devsinc.com" target="_blank" rel="noopener noreferrer" className={styles.logo}>
          <span className={styles.logoIcon}>D</span>
          <span className={styles.logoText}>Devsinc</span>
        </a>
        <nav className={styles.nav}>
          <button
            type="button"
            className={`${styles.navItem} ${tab === "match" ? styles.navActive : ""}`}
            onClick={() => setTab("match")}
          >
            Resource Matcher
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${tab === "resumes" ? styles.navActive : ""}`}
            onClick={() => setTab("resumes")}
          >
            Resume database
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${tab === "convert" ? styles.navActive : ""}`}
            onClick={() => setTab("convert")}
          >
            Resume converter
          </button>
        </nav>
        <div className={styles.sideStats}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{resumes.length}</span>
            <span className={styles.statLabel}>Resumes</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{clusters}</span>
            <span className={styles.statLabel}>Teams</span>
          </div>
        </div>
        <p className={styles.sideFoot}>
          Powered by Claude · Matches against your full resume pool
        </p>
      </aside>

      <main className={styles.main}>
        {tab === "match" ? (
          <>
            <div className={styles.topbar}>
              <h1 className={styles.pageTitle}>Resource Matcher</h1>
              <p className={styles.pageDesc}>
                Paste a job description — get ranked matches in a sortable table from{" "}
                <strong>{resumes.length}</strong> engineer profiles.
              </p>
            </div>

            <div className={styles.panel}>
              <label className={styles.label} htmlFor="jd-input">
                Job description / client requirement
              </label>
              <textarea
                id="jd-input"
                className={styles.jdInput}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleMatch();
                }}
                placeholder="e.g. Senior React developer, 4+ years, Node.js, AWS. Healthcare domain. EST timezone…"
                rows={7}
              />
              <div className={styles.inputFooter}>
                <span className={styles.hint}>⌘ Enter to match</span>
                <button
                  type="button"
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

            {error && (
              <div className={styles.errorBox}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {results && (
              <MatchResultsTable
                results={results}
                onReset={() => {
                  setResults(null);
                  setJd("");
                }}
              />
            )}
          </>
        ) : tab === "resumes" ? (
          <>
            <div className={styles.topbar}>
              <h1 className={styles.pageTitle}>Resume database</h1>
              <p className={styles.pageDesc}>
                Upload JSON/CSV/text resumes, edit fields inline, or paste resume text for AI extraction.
                Changes are saved in your browser and used for matching.
              </p>
            </div>
            <ResumesManager resumes={resumes} onChange={handleResumesChange} />
          </>
        ) : (
          <>
            <div className={styles.topbar}>
              <h1 className={styles.pageTitle}>Resume converter</h1>
              <p className={styles.pageDesc}>
                Upload any PDF, Word, or text resume — get a standardized Devsinc profile Word document
                (.docx) plus structured data you can add to the matcher database.
              </p>
            </div>
            <ResumeConverter resumes={resumes} onAddToDatabase={handleResumesChange} />
          </>
        )}
      </main>
    </div>
  );
}
