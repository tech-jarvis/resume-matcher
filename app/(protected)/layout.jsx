import { redirect } from "next/navigation";
import { getSessionUser, toAuthUser } from "@/lib/session";
import { isDevsincEmail } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function ProtectedLayout({ children }) {
  const session = await getSessionUser();

  if (!session) redirect("/login");
  if (!isDevsincEmail(session.email)) redirect("/login?error=domain");

  return <AppShell user={toAuthUser(session)}>{children}</AppShell>;
}
