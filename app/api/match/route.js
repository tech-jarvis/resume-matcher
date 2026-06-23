import RESOURCES from "@/lib/resources";
import { filterActiveResources } from "@/lib/activeEmployees";
import { createAnthropicClient, ANTHROPIC_MODEL } from "@/lib/anthropicClient";
import { parseAiJson } from "@/lib/parseAiJson";
import { apiErrorResponse } from "@/lib/apiErrors";
import { requireAuth } from "@/lib/supabase/requireAuth";
import { shortlistResources } from "@/lib/filterResources";

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
- Do not invent data not present in the resource profiles
- The candidate pool below has ALREADY been narrowed to people relevant to THIS job description. Evaluate each one on its own merits for this specific JD and rank strictly by genuine technical fit — do not default to "well-known" or earlier-listed people. The ordering of the list is not a ranking.`;

export async function POST(request) {
  const { error: authError } = await requireAuth();
  if (authError) return Response.json({ error: authError }, { status: 401 });

  try {
    const { jd, resources } = await request.json();

    if (!jd || typeof jd !== "string" || jd.trim().length < 10) {
      return Response.json({ error: "Please provide a valid job description." }, { status: 400 });
    }

    const fullPool = filterActiveResources(
      Array.isArray(resources) && resources.length > 0 ? resources : RESOURCES
    );

    // Narrow to the people actually relevant to this JD before sending to the
    // model. This removes positional anchoring (which made unrelated JDs return
    // the same people) and produces genuinely JD-specific, best-fit results.
    const { pool } = shortlistResources(jd, fullPool, 40);
    const client = createAnthropicClient();

    const message = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Candidate engineers relevant to this requirement (unordered):\n${JSON.stringify(pool)}\n\nJob Description / Requirement:\n${jd.trim()}\n\nRank these candidates by genuine fit for THIS job description and return the best matches.`,
        },
      ],
    });

    const raw = message.content?.[0]?.text ?? "";
    return Response.json(parseAiJson(raw));
  } catch (err) {
    return apiErrorResponse(err, "Match API error");
  }
}
