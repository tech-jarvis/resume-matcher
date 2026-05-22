import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { findUserById, sanitizeUser } from "@/lib/users";
import ProfileEditor from "@/components/ProfileEditor";
import styles from "./profile.module.css";

export default async function ProfilePage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const profile = sanitizeUser(await findUserById(session.id));
  if (!profile) redirect("/login");

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My profile</h1>
        <p className={styles.desc}>
          Manage your Devsinc engineer profile, resume, and professional links.
        </p>
      </div>
      <ProfileEditor userId={session.id} initialProfile={profile} />
    </div>
  );
}
