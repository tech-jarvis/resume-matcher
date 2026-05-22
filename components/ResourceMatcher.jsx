"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./ResourceMatcher.module.css";
import { loadResumes, saveResumes, mergeResumes } from "@/lib/resumeStorage";
import MatchResultsTable from "./MatchResultsTable";
import ResumesManager from "./ResumesManager";
import ResumeConverter from "./ResumeConverter";
import ResumeUpdater from "./ResumeUpdater";

export default function ResourceMatcher() {
  const [tab, setTab] = useState("match");
  const [resumes, setResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const loadResumesFromCloud = useCallback(async () => {
    setResumesLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/resources");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load resume database.");
      }
      if (data.resources?.length > 0) {
        setResumes(data.resources);
        saveResumes(data.resources);
      } else {
        setResumes(loadResumes());
      }
    } catch (e) {
      setResumes(loadResumes());
      setError(e.message);
    } finally {
      setResumesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumesFromCloud();
  }, [loadResumesFromCloud]);

  function handleResumesChange(next) {
    setResumes(next);
    saveResumes(next);
  }

  /** After convert/updater saves to Supabase — refresh list + sidebar count immediately */
  const handleResourceSaved = useCallback(
    async (resource) => {
      if (resource?.name) {
        setResumes((prev) => {
          const next = mergeResumes(prev, [resource]);
          saveResumes(next);
          return next;
        });
      }
      await loadResumesFromCloud();
    },
    [loadResumesFromCloud]
  );

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
            Resume database ({resumes.length})
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${tab === "convert" ? styles.navActive : ""}`}
            onClick={() => setTab("convert")}
          >
            Resume converter
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${tab === "updater" ? styles.navActive : ""}`}
            onClick={() => setTab("updater")}
          >
            Resume updater
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
        {error && tab !== "match" && (
          <div className={styles.errorBox}>
            <strong>Error:</strong> {error}
          </div>
        )}
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
        ) : tab === "updater" ? (
          <>
            <div className={styles.topbar}>
              <h1 className={styles.pageTitle}>Resume updater</h1>
              <p className={styles.pageDesc}>
                Paste a job description and upload a resume — get a tailored Devsinc Word document
                and auto-save the profile to the resume database for matching.
              </p>
            </div>
            <ResumeUpdater onSaved={handleResourceSaved} />
          </>
        ) : tab === "resumes" ? (
          <>
            <div className={styles.topbar}>
              <h1 className={styles.pageTitle}>Resume database</h1>
              <p className={styles.pageDesc}>
                <strong>{resumes.length}</strong> engineer profiles in Supabase — including any saved from
                Converter or Updater. Upload JSON/CSV/text, edit inline, or paste resume text for extraction.
              </p>
            </div>
            <ResumesManager
              resumes={resumes}
              loading={resumesLoading}
              onChange={handleResumesChange}
              onReload={loadResumesFromCloud}
            />
          </>
        ) : tab === "convert" ? (
          <>
            <div className={styles.topbar}>
              <h1 className={styles.pageTitle}>Resume converter</h1>
              <p className={styles.pageDesc}>
                Upload any PDF, Word, or text resume — get the official Devsinc Word document and
                auto-save to the resume database for matching.
              </p>
            </div>
            <ResumeConverter onSaved={handleResourceSaved} />
          </>
        ) : null}
      </main>
    </div>
  );
}
