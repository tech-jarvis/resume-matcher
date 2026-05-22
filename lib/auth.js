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
    case "confirm":
      return "Email confirmation failed. Request a new link below.";
    case "otp_expired":
      return "That email link has expired. Use “Reset password” or sign up again to get a new link.";
    case "access_denied":
      return "Sign-in was cancelled or denied. Please try again.";
    case "invalid":
      return "Invalid email or password.";
    case "oauth":
      return "Google sign-in failed. Please try again.";
    case "reset":
      return "Password reset link sent. Check your @devsinc.com inbox.";
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
