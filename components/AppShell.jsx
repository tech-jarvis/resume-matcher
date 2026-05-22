"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AppShell.module.css";

export default function AppShell({ user, children }) {
  const pathname = usePathname();
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>D</span>
          <span className={styles.logoText}>Devsinc Matcher</span>
        </Link>
        <nav className={styles.headerNav}>
          <Link
            href="/"
            className={pathname === "/" ? styles.navActive : styles.navLink}
          >
            Matcher
          </Link>
          <Link
            href="/profile"
            className={pathname === "/profile" ? styles.navActive : styles.navLink}
          >
            My profile
          </Link>
        </nav>
        <div className={styles.userBlock}>
          <span className={styles.userEmail}>{displayName}</span>
          <span className={styles.userDomain}>{user?.email}</span>
          <button
            type="button"
            className={styles.signOut}
            onClick={async () => {
              await fetch("/api/auth/signout", { method: "POST" });
              window.location.href = "/login";
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
