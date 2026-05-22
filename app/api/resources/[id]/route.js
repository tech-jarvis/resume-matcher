import { requireAuth } from "@/lib/supabase/requireAuth";
import { rowToResource, resourceToRow } from "@/lib/supabaseResources";

export async function PATCH(request, { params }) {
  const { user, supabase, error } = await requireAuth();
  if (error) return Response.json({ error }, { status: 401 });

  const id = Number(params.id);
  const body = await request.json();
  const row = resourceToRow(body, user.id);
  delete row.id;

  const { data: existing, error: findErr } = await supabase
    .from("engineer_resources")
    .select("user_id")
    .eq("id", id)
    .single();

  if (findErr || !existing) {
    return Response.json({ error: "Resource not found." }, { status: 404 });
  }
  if (existing.user_id && existing.user_id !== user.id) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data, error: dbErr } = await supabase
    .from("engineer_resources")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 });
  return Response.json({ resource: rowToResource(data) });
}

export async function DELETE(_request, { params }) {
  const { user, supabase, error } = await requireAuth();
  if (error) return Response.json({ error }, { status: 401 });

  const id = Number(params.id);
  const { data: existing, error: findErr } = await supabase
    .from("engineer_resources")
    .select("user_id")
    .eq("id", id)
    .single();

  if (findErr || !existing) {
    return Response.json({ error: "Resource not found." }, { status: 404 });
  }
  if (existing.user_id && existing.user_id !== user.id) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error: dbErr } = await supabase.from("engineer_resources").delete().eq("id", id);

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true });
}
