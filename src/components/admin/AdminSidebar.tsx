"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";

const LINKS = [
  {
    href: "/admin",
    label: "Dashboard",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/articles",
    label: "Articles",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
        <path d="M15 4v5h5M8 13h8M8 17h5" />
      </svg>
    ),
  },
  {
    href: "/admin/topics",
    label: "Topics",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    ),
  },
] as const;

export default function AdminSidebar({ email }: { email: string | undefined }) {
  const pathname = usePathname();
  const initial = (email?.[0] ?? "A").toUpperCase();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-head">
        <span className="admin-sidebar-kicker">CFOmatics</span>
        <strong>Control center</strong>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin">
        <p className="admin-nav-label">Manage</p>
        {LINKS.map((link) => {
          const active =
            "exact" in link && link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              <span className="admin-nav-icon" aria-hidden>
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}

        <p className="admin-nav-label">Shortcuts</p>
        <Link href="/admin/articles/new#generate">
          <span className="admin-nav-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          New article
        </Link>
        <Link href="/">
          <span className="admin-nav-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 11l8-7 8 7" />
              <path d="M6 10v9h12v-9" />
            </svg>
          </span>
          View public site
        </Link>
      </nav>

      <div className="admin-sidebar-foot">
        <div className="admin-user">
          <span className="admin-user-avatar" aria-hidden>
            {initial}
          </span>
          <div>
            <span className="admin-user-role">Administrator</span>
            {email && <p className="admin-sidebar-email">{email}</p>}
          </div>
        </div>
        <form action={signOut}>
          <button type="submit" className="admin-signout">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
