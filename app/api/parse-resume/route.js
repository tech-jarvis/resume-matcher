import { parseResumeWithClaude } from "@/lib/parseResumeWithClaude";
import { requireAuth } from "@/lib/supabase/requireAuth";

export const runtime = "nodejs";

export async function POST(request) {
  const { error: authError } = await requireAuth();
  if (authError) return Response.json({ error: authError }, { status: 401 });

  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return Response.json({ error: "Please provide resume text (at least 20 characters)." }, { status: 400 });
    }

    const parsed = await parseResumeWithClaude(text);

    return Response.json({ resource: parsed });
  } catch (err) {
    console.error("Parse resume error:", err);
    return Response.json(
      { error: err.message ?? "Failed to parse resume." },
      { status: 500 }
    );
  }
}
