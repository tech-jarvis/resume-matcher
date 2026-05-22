"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./ProfileEditor.module.css";

const EMPTY_LINK = { label: "", url: "" };

export default function ProfileEditor({ userId, initialProfile }) {
  const supabase = createClient();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  function update(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  function updateLink(index, field, value) {
    const links = [...(profile.other_links || [])];
    links[index] = { ...links[index], [field]: value };
    update("other_links", links);
  }

  function addLink() {
    update("other_links", [...(profile.other_links || []), { ...EMPTY_LINK }]);
  }

  function removeLink(index) {
    update(
      "other_links",
      (profile.other_links || []).filter((_, i) => i !== index)
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const { error: err } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        designation: profile.designation,
        team: profile.team,
        primary_stack: profile.primary_stack,
        stacks: profile.stacks,
        experience: profile.experience,
        timezone: profile.timezone,
        industries: profile.industries,
        dependency: profile.dependency,
        bio: profile.bio,
        linkedin_url: profile.linkedin_url,
        github_url: profile.github_url,
        portfolio_url: profile.portfolio_url,
        other_links: profile.other_links || [],
      })
      .eq("id", userId);

    setSaving(false);
    if (err) setError(err.message);
    else setMessage("Profile saved successfully.");
  }

  async function handleResumeUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `${userId}/resume-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("resumes")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      setUploading(false);
      setError(uploadErr.message);
      return;
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ resume_path: path })
      .eq("id", userId);

    setUploading(false);
    if (profileErr) setError(profileErr.message);
    else {
      update("resume_path", path);
      setMessage(`Resume uploaded: ${file.name}`);
    }
  }

  async function downloadResume() {
    if (!profile.resume_path) return;
    const { data, error: err } = await supabase.storage
      .from("resumes")
      .createSignedUrl(profile.resume_path, 120);
    if (err) setError(err.message);
    else window.open(data.signedUrl, "_blank");
  }

  if (!profile) return <p>Loading profile…</p>;

  return (
    <form onSubmit={handleSave} className={styles.wrap}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Basic information</h2>
        <div className={styles.grid}>
          <label>
            Full name
            <input value={profile.full_name || ""} onChange={(e) => update("full_name", e.target.value)} />
          </label>
          <label>
            Designation
            <input value={profile.designation || ""} onChange={(e) => update("designation", e.target.value)} placeholder="SSE, ATL, TL…" />
          </label>
          <label>
            Team / cluster
            <input value={profile.team || ""} onChange={(e) => update("team", e.target.value)} />
          </label>
          <label>
            Email
            <input value={profile.email || ""} disabled />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Technical profile</h2>
        <div className={styles.grid}>
          <label>
            Primary stack
            <input value={profile.primary_stack || ""} onChange={(e) => update("primary_stack", e.target.value)} />
          </label>
          <label>
            Experience
            <input value={profile.experience || ""} onChange={(e) => update("experience", e.target.value)} placeholder="4y" />
          </label>
          <label>
            Timezone
            <input value={profile.timezone || ""} onChange={(e) => update("timezone", e.target.value)} placeholder="PKT, EST, Anytime" />
          </label>
          <label>
            Dependency
            <select value={profile.dependency || "Normal"} onChange={(e) => update("dependency", e.target.value)}>
              <option>High</option>
              <option>Normal</option>
              <option>Low</option>
              <option>Medium</option>
            </select>
          </label>
        </div>
        <label className={styles.full}>
          All stacks (comma-separated)
          <textarea rows={3} value={profile.stacks || ""} onChange={(e) => update("stacks", e.target.value)} />
        </label>
        <label className={styles.full}>
          Industries
          <input value={profile.industries || ""} onChange={(e) => update("industries", e.target.value)} />
        </label>
        <label className={styles.full}>
          Bio / summary
          <textarea rows={4} value={profile.bio || ""} onChange={(e) => update("bio", e.target.value)} />
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Links</h2>
        <div className={styles.grid}>
          <label>
            LinkedIn
            <input type="url" value={profile.linkedin_url || ""} onChange={(e) => update("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/…" />
          </label>
          <label>
            GitHub
            <input type="url" value={profile.github_url || ""} onChange={(e) => update("github_url", e.target.value)} />
          </label>
          <label className={styles.full}>
            Portfolio / website
            <input type="url" value={profile.portfolio_url || ""} onChange={(e) => update("portfolio_url", e.target.value)} />
          </label>
        </div>
        <div className={styles.linksBlock}>
          <span className={styles.linksLabel}>Other links</span>
          {(profile.other_links || []).map((link, i) => (
            <div key={i} className={styles.linkRow}>
              <input placeholder="Label" value={link.label || ""} onChange={(e) => updateLink(i, "label", e.target.value)} />
              <input placeholder="https://…" value={link.url || ""} onChange={(e) => updateLink(i, "url", e.target.value)} />
              <button type="button" className={styles.removeLink} onClick={() => removeLink(i)}>×</button>
            </div>
          ))}
          <button type="button" className={styles.addLink} onClick={addLink}>+ Add link</button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Resume file</h2>
        <p className={styles.hint}>Stored securely in Supabase — only you can access your file.</p>
        <div className={styles.resumeActions}>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className={styles.fileInput} onChange={handleResumeUpload} />
          <button type="button" className={styles.btnSecondary} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading…" : profile.resume_path ? "Replace resume" : "Upload resume"}
          </button>
          {profile.resume_path && (
            <button type="button" className={styles.btnSecondary} onClick={downloadResume}>
              Download current resume
            </button>
          )}
        </div>
        {profile.resume_path && (
          <p className={styles.resumePath}>Stored: {profile.resume_path.split("/").pop()}</p>
        )}
      </section>

      <div className={styles.footer}>
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>

      {message && <p className={styles.success}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
