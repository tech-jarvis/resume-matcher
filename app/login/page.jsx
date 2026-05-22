"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage, isDevsincEmail, mapSupabaseAuthError } from "@/lib/auth";
import { authCallbackUrl } from "@/lib/siteUrl";
import styles from "./login.module.css";

export default function LoginPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fromQuery = mapSupabaseAuthError(searchParams);
    if (fromQuery) {
      setMessage(authErrorMessage(fromQuery));
      if (fromQuery === "otp_expired") setMode("reset");
      return;
    }

    // Hash fragment errors: #error_code=otp_expired (not sent to server)
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const fromHash = mapSupabaseAuthError(hashParams);
      if (fromHash) {
        setMessage(authErrorMessage(fromHash));
        if (fromHash === "otp_expired") setMode("reset");
        window.history.replaceState(null, "", "/login");
      }
    }
  }, [searchParams]);

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
          emailRedirectTo: authCallbackUrl(),
        },
      });
      setLoading(false);
      if (error) setMessage(error.message);
      else setSuccess("Account created. Check your @devsinc.com inbox to confirm, then sign in.");
      return;
    }

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: authCallbackUrl("/auth/update-password"),
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
