"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../../login/login.module.css";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) setMessage(error.message);
    else {
      setDone(true);
      setTimeout(() => { window.location.href = "/"; }, 1500);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logoIcon}>D</span>
          <div>
            <h1 className={styles.title}>Set new password</h1>
            <p className={styles.subtitle}>Choose a strong password for your account</p>
          </div>
        </div>

        {done ? (
          <p className={styles.success}>Password updated. Redirecting…</p>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <label>
              New password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </label>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Saving…" : "Update password"}
            </button>
          </form>
        )}

        {message && <p className={styles.error}>{message}</p>}
      </div>
    </div>
  );
}
