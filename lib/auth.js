export const DEVSINC_DOMAIN = "devsinc.com";

export function isDevsincEmail(email) {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(`@${DEVSINC_DOMAIN}`);
}

export function authErrorMessage(code) {
  switch (code) {
    case "domain":
      return "Only @devsinc.com email addresses can access this platform.";
    case "invalid":
      return "Invalid email or password.";
    default:
      return null;
  }
}

/** Map Supabase redirect query/hash params to our error codes */
export function mapSupabaseAuthError(searchParams) {
  const errorCode = searchParams.get("error_code");
  const error = searchParams.get("error");

  if (errorCode === "otp_expired") return "otp_expired";
  if (error === "access_denied" && errorCode) return errorCode;
  if (errorCode) return errorCode;
  if (error && error !== "null") return error;
  return null;
}
