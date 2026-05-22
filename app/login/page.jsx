"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage, isDevsincEmail } from "@/lib/auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const supabase = createClient();
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const errorCode = params?.get("error");
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(authErrorMessage(errorCode));
  const [success, setSuccess] = useState(null);

  async function signInWithGoogle() {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: "devsinc.com" },
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  async function handleEmailAuth(e) {
    e.preventDefault();
    setMessage(null);
    setSuccess(null);

    if (!isDevsincEmail(email)) {
      setMessage(authErrorMessage("domain"));
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setLoading(false);
      if (error) setMessage(error.message);
      else setSuccess("Account created. Check your @devsinc.com inbox to confirm, then sign in.");
      return;
    }

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      setLoading(false);
      if (error) setMessage(error.message);
      else setSuccess(authErrorMessage("reset"));
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
    else window.location.href = "/";
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logoIcon}>D</span>
          <div>
            <h1 className={styles.title}>Devsinc Matcher</h1>
            <p className={styles.subtitle}>Sign in with your @devsinc.com account</p>
          </div>
        </div>

        <button
          type="button"
          className={styles.googleBtn}
          onClick={signInWithGoogle}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.073 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 28.991 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 28.991 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-6.627 0-12-5.373-12-12 0-1.202.178-2.36.511-3.471l-7.26-5.64C6.053 16.36 4 19.991 4 24c0 11.045 8.955 20 20 20z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Continue with Google
        </button>

        <div className={styles.divider}><span>or use email</span></div>

        <div className={styles.tabs}>
          {["signin", "signup", "reset"].map((m) => (
            <button
              key={m}
              type="button"
              className={`${styles.tab} ${mode === m ? styles.tabActive : ""}`}
              onClick={() => { setMode(m); setMessage(null); setSuccess(null); }}
            >
              {m === "signin" ? "Sign in" : m === "signup" ? "Sign up" : "Reset password"}
            </button>
          ))}
        </div>

        <form onSubmit={handleEmailAuth} className={styles.form}>
          {mode === "signup" && (
            <label>
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </label>
          )}
          <label>
            Work email (@devsinc.com)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@devsinc.com"
              required
            />
          </label>
          {mode !== "reset" && (
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
          )}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </button>
        </form>

        {message && <p className={styles.error}>{message}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <p className={styles.foot}>
          Access restricted to Devsinc employees. Contact IT if you need help.
        </p>
      </div>
    </div>
  );
}
