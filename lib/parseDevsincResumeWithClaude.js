import Anthropic from "@anthropic-ai/sdk";
import {
  normalizeDevsincResume,
  PARSE_DEVSINC_RESUME_PROMPT,
} from "@/lib/devsincResumeSchema";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJsonFromClaude(raw) {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

export async function parseDevsincResumeWithClaude(text) {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `${PARSE_DEVSINC_RESUME_PROMPT}\n\nResume text:\n${text.trim()}`,
      },
    ],
  });

  const raw = message.content?.[0]?.text ?? "";
  return normalizeDevsincResume(parseJsonFromClaude(raw));
}
