import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/supabase/requireAuth";
import DEFAULT_RESOURCES from "@/lib/resources";
import { resourceToRow } from "@/lib/supabaseResources";

export const runtime = "nodejs";

export async function POST() {
  const { user, error } = await requireAuth();
  if (error) return Response.json({ error }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { count } = await admin
    .from("engineer_resources")
    .select("*", { count: "exact", head: true });

  if (count > 0) {
    return Response.json({ error: "Database already has resources. Seed skipped." }, { status: 400 });
  }

  const rows = DEFAULT_RESOURCES.map((r) => ({
    ...resourceToRow(r, null),
    user_id: null,
    id: undefined,
  }));

  const { error: insertErr } = await admin.from("engineer_resources").insert(rows);
  if (insertErr) {
    return Response.json({ error: insertErr.message }, { status: 500 });
  }

  return Response.json({ seeded: rows.length });
}
