"use client";

import { useRef, useState } from "react";
import { mergeResumes, saveResumes } from "@/lib/resumeStorage";
import { devsincResumeToResource } from "@/lib/resourceToDevsincResume";
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

export default function ResumeConverter({ resumes, onAddToDatabase }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function convertFile(file) {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/convert-resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Conversion failed");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    convertFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    convertFile(file);
  }

  function handleAddToDb() {
    const resume = result?.resume ?? result?.resource;
    if (!resume?.name) return;
    const row = devsincResumeToResource(resume);
    const next = mergeResumes(resumes, [row]);
    onAddToDatabase(next);
    saveResumes(next);
    setError(null);
    alert(`Added ${resume.name} to the resume database.`);
  }

  const r = result?.resume ?? result?.resource;

  return (
    <div className={styles.wrap}>
      <p className={styles.templateBar}>
        <a href="/api/templates/devsinc-resume" className={styles.templateLink} download>
          Download official Devsinc resume template (.docx / .pdf)
        </a>
      </p>
      <div
        className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""} ${loading ? styles.dropzoneLoading : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !loading && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className={styles.fileInput}
          onChange={handleFileInput}
        />
        {loading ? (
          <>
            <span className={styles.spinner} />
            <p className={styles.dropTitle}>Converting to Devsinc format…</p>
            <p className={styles.dropHint}>Extracting text → AI mapping → generating Word doc</p>
          </>
        ) : (
          <>
            <span className={styles.dropIcon}>📄</span>
            <p className={styles.dropTitle}>Drop resume here or click to upload</p>
            <p className={styles.dropHint}>
              PDF · DOCX · DOC · TXT — max 10 MB
            </p>
          </>
        )}
      </div>

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
                {r.designation} · {r.primary} · {result.extractedChars?.toLocaleString()} chars extracted
              </p>
            </div>
            <div className={styles.resultActions}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => downloadBase64Docx(result.docxBase64, result.filename)}
              >
                Download Word (.docx)
              </button>
              <button type="button" className={styles.btnSecondary} onClick={handleAddToDb}>
                Add to database
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => { setResult(null); setError(null); }}
              >
                Convert another
              </button>
            </div>
          </div>

          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <h3>Summary</h3>
              <p>{r.summary || "—"}</p>
              <h3>Work experience</h3>
              <ul className={styles.compactList}>
                {(r.workExperience || []).slice(0, 3).map((job, i) => (
                  <li key={i}>
                    <strong>{job.title}</strong> — {job.company}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.previewCard}>
              <h3>Skills</h3>
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
            Download uses the official Devsinc resume layout: two columns (experience & projects
            left; contact, skills & achievements right), teal section headers (#16BBBA), and
            sidebar styling matching the template PDF.
          </p>
        </div>
      )}
    </div>
  );
}
