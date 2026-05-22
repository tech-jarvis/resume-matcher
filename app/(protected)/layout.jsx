import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDevsincEmail } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function ProtectedLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!isDevsincEmail(user.email)) {
    await supabase.auth.signOut();
    redirect("/login?error=domain");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
