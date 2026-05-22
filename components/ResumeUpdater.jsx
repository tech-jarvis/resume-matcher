"use client";

import { useRef, useState } from "react";
import { supportedExtensions } from "@/lib/supportedFormats";
import styles from "./ResumeConverter.module.css";

const ACCEPT = supportedExtensions().join(",");

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

export default function ResumeUpdater() {
  const fileRef = useRef(null);
  const [jd, setJd] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [usePaste, setUsePaste] = useState(false);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleUpdate() {
    if (!jd.trim() || jd.trim().length < 20) {
      setError("Paste a job description (at least 20 characters).");
      return;
    }
    if (!usePaste && !file) {
      setError("Upload a resume file or switch to paste mode.");
      return;
    }
    if (usePaste && resumeText.trim().length < 50) {
      setError("Paste resume text (at least 50 characters).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("jd", jd.trim());
    if (usePaste) {
      formData.append("text", resumeText.trim());
    } else if (file) {
      formData.append("file", file);
    }

    try {
      const res = await fetch("/api/update-resume", {
        method: "POST",
        body: formData,
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
      if (!res.ok) throw new Error(data.error || "Update failed");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFilePick(f) {
    if (!f) return;
    setFile(f);
    setUsePaste(false);
    setError(null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFilePick(e.dataTransfer.files?.[0]);
  }

  const r = result?.resume;

  return (
    <div className={styles.wrap}>
      <p className={styles.templateBar}>
        <a href="/api/templates/devsinc-resume" className={styles.templateLink} download>
          Download official Devsinc resume template (PDF)
        </a>
      </p>
      <div className={styles.previewCard} style={{ marginBottom: 0 }}>
        <h3 style={{ marginTop: 0 }}>Job description</h3>
        <textarea
          className={styles.textArea}
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the client JD or role requirements. The resume will be tailored to emphasize matching skills, experience, and projects…"
          rows={6}
          disabled={loading}
        />
      </div>

      <div className={styles.modeRow}>
        <button
          type="button"
          className={`${styles.btnGhost} ${!usePaste ? styles.btnActive : ""}`}
          onClick={() => setUsePaste(false)}
          disabled={loading}
        >
          Upload file
        </button>
        <button
          type="button"
          className={`${styles.btnGhost} ${usePaste ? styles.btnActive : ""}`}
          onClick={() => setUsePaste(true)}
          disabled={loading}
        >
          Paste resume text
        </button>
      </div>

      {!usePaste ? (
        <div
          className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""} ${loading ? styles.dropzoneLoading : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !loading && fileRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className={styles.fileInput}
            onChange={(e) => handleFilePick(e.target.files?.[0])}
          />
          {file ? (
            <>
              <span className={styles.dropIcon}>✓</span>
              <p className={styles.dropTitle}>{file.name}</p>
              <p className={styles.dropHint}>Click to choose a different file</p>
            </>
          ) : (
            <>
              <span className={styles.dropIcon}>📄</span>
              <p className={styles.dropTitle}>Drop resume here or click to upload</p>
              <p className={styles.dropHint}>PDF · DOCX · DOC · TXT — max 10 MB</p>
            </>
          )}
        </div>
      ) : (
        <textarea
          className={styles.textArea}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste the full resume text here…"
          rows={10}
          disabled={loading}
        />
      )}

      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handleUpdate}
          disabled={loading || !jd.trim()}
        >
          {loading ? (
            <>
              <span className={styles.spinner} />
              Tailoring resume…
            </>
          ) : (
            "Update resume for JD →"
          )}
        </button>
      </div>

      {loading && (
        <p className={styles.dropHint}>
          Parsing → mapping to Devsinc template → tailoring to JD → generating Word doc
        </p>
      )}

      {error && (
        <div className={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {r && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <div>
              <h2 className={styles.resultTitle}>{r.name}</h2>
              <p className={styles.resultSub}>
                {r.designation} · tailored to JD · {result.extractedChars?.toLocaleString()} chars
                from source
              </p>
            </div>
            <div className={styles.resultActions}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => downloadBase64Docx(result.docxBase64, result.filename)}
              >
                Download Devsinc resume (.docx)
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => { setResult(null); setError(null); }}
              >
                Start over
              </button>
            </div>
          </div>

          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <h3>Summary (tailored)</h3>
              <p>{r.summary || "—"}</p>
              <h3>Work experience</h3>
              <ul className={styles.compactList}>
                {(r.workExperience || []).slice(0, 3).map((job, i) => (
                  <li key={i}>
                    <strong>{job.title}</strong> — {job.company}
                    {job.bullets?.[0] && (
                      <span className={styles.muted}> · {job.bullets[0]}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.previewCard}>
              <h3>Skills (JD-aligned)</h3>
              <p>
                <strong>Technology:</strong> {r.skills?.technology || "—"}
              </p>
              <h3>Projects</h3>
              <ul className={styles.compactList}>
                {(r.projects || []).slice(0, 4).map((p, i) => (
                  <li key={i}>{p.name}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className={styles.docNote}>
            Output follows the official Devsinc resume template: name, summary, work experience,
            contact, skills, achievements, projects, certificates, and education — aligned to your
            job description.
          </p>
        </div>
      )}
    </div>
  );
}
