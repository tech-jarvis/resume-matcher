import { ApiError } from "@/lib/apiErrors";

export function parseAiJson(raw) {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  if (!cleaned) {
    throw new ApiError(
      "AI returned an empty response. Please try again.",
      500,
      "empty_ai_response"
    );
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new ApiError(
      "AI returned an invalid response. Please try again. If it keeps failing, the input may be too long.",
      500,
      "invalid_ai_response"
    );
  }
}
