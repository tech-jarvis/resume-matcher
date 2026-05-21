import Anthropic from "@anthropic-ai/sdk";
import RESOURCES from "@/lib/resources";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert technical recruiter at Devsinc, a software outsourcing company.
Your job is to match job descriptions or client requirements to the best available engineers from our talent pool.

Analyze the JD carefully for:
1. Required tech stack and technologies
2. Experience level needed
3. Industry domain experience
4. Timezone preferences
5. Seniority level

Return ONLY a valid JSON object with this exact structure (no markdown fences, no explanation):
{
  "summary": "2-3 sentence analysis of what this JD requires",
  "matches": [
    {
      "id": <number>,
      "name": "<name>",
      "team": "<team>",
      "designation": "<designation>",
      "primary": "<primary stack>",
      "stacks": "<all stacks>",
      "exp": "<experience>",
      "tz": "<timezone>",
      "industries": "<industries>",
      "matchScore": <number 0-100>,
      "matchReason": "<2-3 sentence explanation of why this person matches>",
      "strengths": ["strength1", "strength2", "strength3"],
      "consideration": "<any gap or consideration to be aware of, or empty string>"
    }
  ],
  "topPick": <id of best single match>,
  "clusterNote": "<which cluster/team has the most relevant resources>"
}

Rules:
- Return 5-8 best matches, ranked by matchScore descending
- matchScore reflects genuine fit: 90+ excellent, 70-89 good, 50-69 fair
- Be specific about WHY each person matches — reference their actual tech stack and industries
- Consider both primary AND secondary tech stacks
- If the JD needs a team (multiple roles), note that in the summary
- Do not invent data not present in the resource profiles`;

export async function POST(request) {
  try {
    const { jd, resources } = await request.json();

    if (!jd || typeof jd !== "string" || jd.trim().length < 10) {
      return Response.json({ error: "Please provide a valid job description." }, { status: 400 });
    }

    const pool = Array.isArray(resources) && resources.length > 0 ? resources : RESOURCES;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here are all Devsinc resources:\n${JSON.stringify(pool)}\n\nJob Description / Requirement:\n${jd.trim()}\n\nFind the best matches.`,
        },
      ],
    });

    const raw = message.content?.[0]?.text ?? "";
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return Response.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 });
    }

    return Response.json(parsed);
  } catch (err) {
    console.error("Match API error:", err);
    return Response.json(
      { error: err.message ?? "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
