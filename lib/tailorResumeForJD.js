import {
  normalizeDevsincResume,
  TAILOR_RESUME_JD_PROMPT,
} from "@/lib/devsincResumeSchema";
import { createAnthropicClient, ANTHROPIC_MODEL } from "@/lib/anthropicClient";
import { parseAiJson } from "@/lib/parseAiJson";

export async function tailorResumeForJD(resume, jd) {
  const client = createAnthropicClient();
  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `${TAILOR_RESUME_JD_PROMPT}\n\nJob description:\n${jd.trim()}\n\nCurrent resume JSON:\n${JSON.stringify(resume, null, 2)}`,
      },
    ],
  });

  const raw = message.content?.[0]?.text ?? "";
  return normalizeDevsincResume(parseAiJson(raw));
}
