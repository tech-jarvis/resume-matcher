/**
 * User-facing API errors — maps provider failures (Anthropic, Supabase, etc.) to clear messages.
 */

export class ApiError extends Error {
  constructor(message, status = 500, code = "unknown") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const PLACEHOLDER_KEY_PATTERNS = [
  /^sk-ant-your/i,
  /^your-/i,
  /^xxx/i,
  /^placeholder/i,
];

export function getAnthropicApiKey() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  if (PLACEHOLDER_KEY_PATTERNS.some((p) => p.test(key))) return null;
  if (key.length < 20) return null;
  return key;
}

export function assertAnthropicConfigured() {
  const key = getAnthropicApiKey();
  if (!key) {
    throw new ApiError(
      "Anthropic API key is missing or invalid. Add ANTHROPIC_API_KEY to .env.local (get one at https://console.anthropic.com/settings/keys).",
      503,
      "missing_api_key"
    );
  }
  return key;
}

function getSupabaseEnvStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const missing = [];
  if (!url || url.includes("your-project")) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey || serviceKey === "your-service-role-key") {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  return missing;
}

export function assertSupabaseConfigured() {
  const missing = getSupabaseEnvStatus();
  if (missing.length > 0) {
    throw new ApiError(
      `Supabase is not configured. Set ${missing.join(" and ")} in .env.local.`,
      503,
      "missing_supabase"
    );
  }
}

export function mapAnthropicError(err) {
  if (!getAnthropicApiKey()) {
    return {
      message:
        "Anthropic API key is missing or invalid. Add ANTHROPIC_API_KEY to .env.local.",
      status: 503,
      code: "missing_api_key",
    };
  }

  const status = err?.status ?? err?.statusCode;
  const type = err?.error?.type ?? err?.type;
  const providerMsg =
    err?.error?.message ?? err?.message ?? "Anthropic API request failed.";

  if (status === 401 || type === "authentication_error") {
    return {
      message:
        "Invalid Anthropic API key. Check ANTHROPIC_API_KEY in .env.local and create a new key at https://console.anthropic.com/settings/keys if needed.",
      status: 401,
      code: "invalid_api_key",
    };
  }

  if (status === 403 || type === "permission_error") {
    return {
      message: `Anthropic access denied: ${providerMsg}`,
      status: 403,
      code: "api_forbidden",
    };
  }

  if (status === 429 || type === "rate_limit_error") {
    return {
      message:
        "Anthropic rate limit reached. Wait a moment and try again, or check billing/usage at https://console.anthropic.com/.",
      status: 429,
      code: "rate_limit",
    };
  }

  if (status === 529 || type === "overloaded_error") {
    return {
      message: "Anthropic is temporarily overloaded. Please try again in a few seconds.",
      status: 503,
      code: "overloaded",
    };
  }

  if (status === 400 || type === "invalid_request_error") {
    return {
      message: `Anthropic request error: ${providerMsg}`,
      status: 400,
      code: "invalid_request",
    };
  }

  if (status === 500 || status === 502 || status === 503 || type === "api_error") {
    return {
      message: "Anthropic service error. Please try again shortly.",
      status: 503,
      code: "provider_error",
    };
  }

  const msg = String(providerMsg).toLowerCase();
  if (msg.includes("credit") || msg.includes("billing") || msg.includes("balance")) {
    return {
      message:
        "Anthropic account has no credits or billing issue. Add credits at https://console.anthropic.com/settings/billing.",
      status: 402,
      code: "billing",
    };
  }

  if (
    msg.includes("connection") ||
    msg.includes("network") ||
    msg.includes("econnrefused") ||
    msg.includes("fetch failed")
  ) {
    return {
      message: "Could not reach Anthropic API. Check your network connection and try again.",
      status: 503,
      code: "network",
    };
  }

  return {
    message: providerMsg,
    status: status && status >= 400 && status < 600 ? status : 500,
    code: "anthropic_error",
  };
}

export function mapSupabaseError(err) {
  const missing = getSupabaseEnvStatus();
  if (missing.length > 0) {
    return {
      message: `Supabase is not configured. Set ${missing.join(" and ")} in .env.local.`,
      status: 503,
      code: "missing_supabase",
    };
  }

  const msg = err?.message ?? String(err);
  const code = err?.code ?? "";

  if (msg.includes("Missing Supabase")) {
    return {
      message: msg,
      status: 503,
      code: "missing_supabase",
    };
  }

  if (code === "PGRST301" || msg.includes("JWT") || msg.includes("Invalid API key")) {
    return {
      message:
        "Invalid Supabase service role key. Check SUPABASE_SERVICE_ROLE_KEY in .env.local (Project Settings → API).",
      status: 401,
      code: "invalid_supabase_key",
    };
  }

  if (msg.includes("ENOTFOUND") || msg.includes("fetch failed")) {
    return {
      message:
        "Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in .env.local.",
      status: 503,
      code: "supabase_network",
    };
  }

  if (code === "23505") {
    return {
      message: "This record already exists in the database.",
      status: 409,
      code: "duplicate",
    };
  }

  return {
    message: msg,
    status: 500,
    code: "database_error",
  };
}

export function mapJsonParseError() {
  return {
    message:
      "AI returned an invalid response. Please try again. If it keeps failing, the resume may be too long.",
    status: 500,
    code: "invalid_ai_response",
  };
}

/** Classify any thrown error for API responses */
export function mapError(err) {
  if (err instanceof ApiError) {
    return { message: err.message, status: err.status, code: err.code };
  }

  const name = err?.name ?? "";
  const msg = err?.message ?? "";

  if (name === "SyntaxError" && msg.includes("JSON")) {
    return mapJsonParseError();
  }

  if (
    err?.status !== undefined ||
    err?.error?.type ||
    msg.includes("anthropic") ||
    msg.includes("api key") && msg.includes("401")
  ) {
    return mapAnthropicError(err);
  }

  if (
    err?.code?.startsWith?.("PGRST") ||
    err?.code?.startsWith?.("23") ||
    msg.includes("Supabase") ||
    msg.includes("supabase")
  ) {
    return mapSupabaseError(err);
  }

  if (msg.includes("Could not extract enough text")) {
    return { message: msg, status: 400, code: "extract_failed" };
  }

  if (msg.includes("Unsupported") || msg.includes("Unsupported file")) {
    return { message: msg, status: 400, code: "unsupported_file" };
  }

  if (msg.includes("SESSION_SECRET") || msg.includes("SUPABASE_JWT_SECRET")) {
    return {
      message:
        "Server session secret is missing. Set SESSION_SECRET in .env.local.",
      status: 503,
      code: "missing_session_secret",
    };
  }

  return {
    message: msg || "An unexpected error occurred. Please try again.",
    status: 500,
    code: "unknown",
  };
}

/** Standard JSON error response for route handlers */
export function apiErrorResponse(err, logLabel = "API error") {
  console.error(logLabel, err);
  const { message, status, code } = mapError(err);
  return Response.json({ error: message, code }, { status });
}
