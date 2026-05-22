"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ProfileEditor.module.css";

const EMPTY_LINK = { label: "", url: "" };

export default function ProfileEditor({ userId, initialProfile }) {
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(initialProfile);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
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

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data.profile);
      setMessage("Profile saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setChangingPw(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentPassword("");
      setNewPassword("");
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setChangingPw(false);
    }
  }

  async function handleResumeUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/user/resume", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      update("resume_path", data.resume_path);
      setMessage(`Resume uploaded: ${file.name}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function downloadResume() {
    try {
      const res = await fetch("/api/user/resume");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.open(data.url, "_blank");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!profile) return <p>Loading profile…</p>;

  return (
    <div className={styles.wrap}>
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
              <input value={profile.designation || ""} onChange={(e) => update("designation", e.target.value)} />
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
              <input value={profile.experience || ""} onChange={(e) => update("experience", e.target.value)} />
            </label>
            <label>
              Timezone
              <input value={profile.timezone || ""} onChange={(e) => update("timezone", e.target.value)} />
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
            All stacks
            <textarea rows={3} value={profile.stacks || ""} onChange={(e) => update("stacks", e.target.value)} />
          </label>
          <label className={styles.full}>
            Industries
            <input value={profile.industries || ""} onChange={(e) => update("industries", e.target.value)} />
          </label>
          <label className={styles.full}>
            Bio
            <textarea rows={4} value={profile.bio || ""} onChange={(e) => update("bio", e.target.value)} />
          </label>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Links</h2>
          <div className={styles.grid}>
            <label>
              LinkedIn
              <input type="url" value={profile.linkedin_url || ""} onChange={(e) => update("linkedin_url", e.target.value)} />
            </label>
            <label>
              GitHub
              <input type="url" value={profile.github_url || ""} onChange={(e) => update("github_url", e.target.value)} />
            </label>
            <label className={styles.full}>
              Portfolio
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
          <div className={styles.resumeActions}>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className={styles.fileInput} onChange={handleResumeUpload} />
            <button type="button" className={styles.btnSecondary} onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : profile.resume_path ? "Replace resume" : "Upload resume"}
            </button>
            {profile.resume_path && (
              <button type="button" className={styles.btnSecondary} onClick={downloadResume}>
                Download resume
              </button>
            )}
          </div>
        </section>

        <div className={styles.footer}>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Change password</h2>
        <form onSubmit={handleChangePassword} className={styles.grid}>
          <label>
            Current password
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </label>
          <label>
            New password
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
          </label>
          <button type="submit" className={styles.saveBtn} disabled={changingPw}>
            {changingPw ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      {message && <p className={styles.success}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
