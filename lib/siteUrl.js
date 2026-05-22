/** Canonical app URL for auth redirects (Supabase OAuth, email links). */
export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function authCallbackUrl(next = "/") {
  const base = getSiteUrl();
  const path = next === "/" ? "/auth/callback" : `/auth/callback?next=${encodeURIComponent(next)}`;
  return `${base}${path}`;
}
