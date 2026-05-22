import { devsincResumeToResource } from "@/lib/resourceToDevsincResume";
import { resourceToRow, rowToResource } from "@/lib/supabaseResources";

/**
 * Upsert engineer_resources from a Devsinc resume object (insert or update by name).
 */
export async function saveResourceFromResume(supabase, userId, resume) {
  const resource = devsincResumeToResource(resume);
  if (!resource.name?.trim()) {
    throw new Error("Resume must include a name to save to the database.");
  }

  const row = resourceToRow(resource, userId);
  delete row.id;

  const { data: matches, error: findErr } = await supabase
    .from("engineer_resources")
    .select("id, user_id, name")
    .ilike("name", resource.name.trim());

  if (findErr) throw findErr;

  const existing =
    matches?.find((r) => r.name?.trim().toLowerCase() === resource.name.trim().toLowerCase()) ??
    matches?.[0];

  if (existing) {
    const { data, error: updateErr } = await supabase
      .from("engineer_resources")
      .update(row)
      .eq("id", existing.id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    return { resource: rowToResource(data), created: false };
  }

  const { data, error: insertErr } = await supabase
    .from("engineer_resources")
    .insert(row)
    .select()
    .single();

  if (insertErr) throw insertErr;
  return { resource: rowToResource(data), created: true };
}
