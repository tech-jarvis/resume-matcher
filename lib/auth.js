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
      return "Check your inbox to confirm your email before signing in.";
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
