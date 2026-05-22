/** Map between app resource shape and Supabase engineer_resources rows */

export function rowToResource(row) {
  return {
    id: row.id,
    name: row.name,
    team: row.team,
    designation: row.designation,
    primary: row.primary_stack,
    stacks: row.stacks,
    exp: row.exp,
    tz: row.tz,
    industries: row.industries,
    dep: row.dep,
    user_id: row.user_id,
  };
}

export function resourceToRow(resource, userId) {
  return {
    id: typeof resource.id === "number" && resource.id < 1e12 ? resource.id : undefined,
    user_id: userId,
    name: resource.name,
    team: resource.team,
    designation: resource.designation,
    primary_stack: resource.primary,
    stacks: resource.stacks,
    exp: resource.exp,
    tz: resource.tz,
    industries: resource.industries,
    dep: resource.dep || "Normal",
  };
}

export async function fetchResources(supabase) {
  const { data, error } = await supabase
    .from("engineer_resources")
    .select("*")
    .order("name");

  if (error) throw error;
  return (data ?? []).map(rowToResource);
}
