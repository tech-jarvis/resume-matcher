import { createAnthropicClient, ANTHROPIC_MODEL } from "@/lib/anthropicClient";
import { parseAiJson } from "@/lib/parseAiJson";

const CONVERT_PROMPT = `You are a Devsinc HR specialist. Convert the resume into Devsinc's standardized engineer resource profile format.

Return ONLY valid JSON (no markdown fences):
{
  "name": "full name",
  "team": "suggested cluster/team lead or department",
  "designation": "SE | SSE | ATL | TL | ASE | etc.",
  "primary": "primary tech stack label",
  "stacks": "comma-separated all technologies and skills",
  "exp": "total experience e.g. 4y",
  "tz": "preferred timezone e.g. PKT, EST, Anytime",
  "industries": "comma-separated industries worked in",
  "dep": "High | Normal | Low | Medium",
  "summary": "2-3 professional sentences summarizing this engineer for client-facing profiles",
  "highlights": ["key achievement or strength", "another highlight", "third highlight"]
}

Rules:
- Infer reasonable values when not explicit; do not invent employers not in the resume
- stacks must be comprehensive from the resume
- highlights: 3-5 concise bullets`;

export async function parseResumeWithClaude(text) {
  const client = createAnthropicClient();
  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `${CONVERT_PROMPT}\n\nResume text:\n${text.trim()}`,
      },
    ],
  });

  const raw = message.content?.[0]?.text ?? "";
  const parsed = parseAiJson(raw);
  parsed.id = parsed.id ?? Date.now();
  parsed.dep = parsed.dep || "Normal";
  parsed.highlights = Array.isArray(parsed.highlights) ? parsed.highlights : [];

  return parsed;
}
