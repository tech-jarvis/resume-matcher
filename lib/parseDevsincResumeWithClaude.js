import {
  normalizeDevsincResume,
  PARSE_DEVSINC_RESUME_PROMPT,
} from "@/lib/devsincResumeSchema";
import { createAnthropicClient, ANTHROPIC_MODEL } from "@/lib/anthropicClient";
import { parseAiJson } from "@/lib/parseAiJson";

export async function parseDevsincResumeWithClaude(text) {
  const client = createAnthropicClient();
  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `${PARSE_DEVSINC_RESUME_PROMPT}\n\nResume text:\n${text.trim()}`,
      },
    ],
  });

  const raw = message.content?.[0]?.text ?? "";
  return normalizeDevsincResume(parseAiJson(raw));
}
