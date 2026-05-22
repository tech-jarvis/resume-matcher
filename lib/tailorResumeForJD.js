import Anthropic from "@anthropic-ai/sdk";
import {
  normalizeDevsincResume,
  TAILOR_RESUME_JD_PROMPT,
} from "@/lib/devsincResumeSchema";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJsonFromClaude(raw) {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

export async function tailorResumeForJD(resume, jd) {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `${TAILOR_RESUME_JD_PROMPT}\n\nJob description:\n${jd.trim()}\n\nCurrent resume JSON:\n${JSON.stringify(resume, null, 2)}`,
      },
    ],
  });

  const raw = message.content?.[0]?.text ?? "";
  return normalizeDevsincResume(parseJsonFromClaude(raw));
}
