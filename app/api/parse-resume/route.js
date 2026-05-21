import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = `Extract engineer profile data from this resume text.
Return ONLY valid JSON (no markdown) with this shape:
{
  "name": "",
  "team": "",
  "designation": "",
  "primary": "",
  "stacks": "",
  "exp": "",
  "tz": "",
  "industries": "",
  "dep": "Normal"
}
Use comma-separated strings for stacks and industries. designation examples: SE, SSE, ATL, TL.`;

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return Response.json({ error: "Please provide resume text (at least 20 characters)." }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `${PROMPT}\n\nResume:\n${text.trim()}`,
        },
      ],
    });

    const raw = message.content?.[0]?.text ?? "";
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    parsed.id = Date.now();

    return Response.json({ resource: parsed });
  } catch (err) {
    console.error("Parse resume error:", err);
    return Response.json(
      { error: err.message ?? "Failed to parse resume." },
      { status: 500 }
    );
  }
}
