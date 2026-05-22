"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authErrorMessage, isDevsincEmail, mapSupabaseAuthError } from "@/lib/auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fromQuery = mapSupabaseAuthError(searchParams);
    if (fromQuery) setMessage(authErrorMessage(fromQuery));
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!isDevsincEmail(email)) {
      setMessage(authErrorMessage("domain"));
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
      const body =
        mode === "signup"
          ? { email, password, full_name: fullName }
          : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = "/";
    } catch (err) {
      setMessage(err.message);
      setLoading(false);
    }
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

        <div className={styles.tabs}>
          {["signin", "signup"].map((m) => (
            <button
              key={m}
              type="button"
              className={`${styles.tab} ${mode === m ? styles.tabActive : ""}`}
              onClick={() => { setMode(m); setMessage(null); }}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {message && <p className={styles.error}>{message}</p>}

        <p className={styles.foot}>
          Only @devsinc.com addresses. Change your password anytime under My profile.
        </p>
      </div>
    </div>
  );
}
