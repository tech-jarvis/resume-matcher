import { apiErrorResponse, mapError } from "@/lib/apiErrors";
import { requireAuth } from "@/lib/supabase/requireAuth";
import { rowToResource, resourceToRow } from "@/lib/supabaseResources";

export async function GET() {
  const { supabase, error } = await requireAuth();
  if (error) return Response.json({ error }, { status: 401 });

  const { data, error: dbErr } = await supabase
    .from("engineer_resources")
    .select("*")
    .order("name");

  if (dbErr) {
    const mapped = mapError(dbErr);
    return Response.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
  return Response.json({ resources: (data ?? []).map(rowToResource) });
}

export async function POST(request) {
  const { user, supabase, error } = await requireAuth();
  if (error) return Response.json({ error }, { status: 401 });

  try {
    const body = await request.json();
    const row = resourceToRow(body, user.id);
    delete row.id;

    const { data, error: dbErr } = await supabase
      .from("engineer_resources")
      .insert(row)
      .select()
      .single();

    if (dbErr) {
      const mapped = mapError(dbErr);
      return Response.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
    }
    return Response.json({ resource: rowToResource(data) });
  } catch (err) {
    return apiErrorResponse(err, "POST resource error");
  }
}
