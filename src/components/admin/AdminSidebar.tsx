"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
  icon: React.ReactNode;
};

const MANAGE: NavLink[] = [
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
];

const AUDIENCE: NavLink[] = [
  {
    href: "/admin/subscribers",
    label: "Subscribers",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6h16v12H4z" />
        <path d="M4 7l8 6 8-6" />
      </svg>
    ),
  },
];

const PRIVACY: NavLink[] = [
  {
    href: "/admin/cookies-report",
    label: "Cookies & visitors",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="14" cy="9" r="1" fill="currentColor" stroke="none" />
        <circle cx="11" cy="14" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/admin/gdpr",
    label: "GDPR",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

function NavGroup({
  label,
  links,
  pathname,
  onNavigate,
}: {
  label: string;
  links: NavLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <p className="admin-nav-label">{label}</p>
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
          >
            <span className="admin-nav-icon" aria-hidden>
              {link.icon}
            </span>
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export default function AdminSidebar({ email }: { email: string | undefined }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initial = (email?.[0] ?? "A").toUpperCase();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("admin-nav-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("admin-nav-open");
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <div className="admin-mobile-bar">
        <button
          type="button"
          className="admin-menu-btn"
          aria-expanded={open}
          aria-controls="admin-sidebar"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="admin-menu-icon" aria-hidden>
            {open ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </span>
          Menu
        </button>
        <div className="admin-mobile-bar-meta">
          <strong>Control center</strong>
          <form action={signOut}>
            <button type="submit" className="admin-mobile-signout">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {open ? (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close menu"
          onClick={close}
        />
      ) : null}

      <aside
        id="admin-sidebar"
        className={`admin-sidebar${open ? " is-open" : ""}`}
      >
        <div className="admin-sidebar-head">
          <span className="admin-sidebar-kicker">CFOmatics</span>
          <strong>Control center</strong>
          <p className="admin-sidebar-tagline">Publishing · audience · privacy</p>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin">
          <NavGroup
            label="Manage"
            links={MANAGE}
            pathname={pathname}
            onNavigate={close}
          />
          <NavGroup
            label="Audience"
            links={AUDIENCE}
            pathname={pathname}
            onNavigate={close}
          />
          <NavGroup
            label="Privacy"
            links={PRIVACY}
            pathname={pathname}
            onNavigate={close}
          />

          <p className="admin-nav-label">Shortcuts</p>
          <Link href="/admin/articles/new#generate" onClick={close}>
            <span className="admin-nav-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            New article
          </Link>
          <Link href="/" target="_blank" onClick={close}>
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
            <div className="admin-user-copy">
              <span className="admin-user-role">Administrator</span>
              {email && <p className="admin-sidebar-email">{email}</p>}
            </div>
          </div>
          <form action={signOut} className="admin-signout-form">
            <button type="submit" className="admin-signout">
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
