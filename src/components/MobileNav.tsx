"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TopicLink = { id: string; slug: string; name: string };

export default function MobileNav({
  topics,
}: {
  topics: TopicLink[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mobile-nav">
      <button
        type="button"
        className={`menu-btn ${open ? "is-open" : ""}`}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="mobile-drawer" role="dialog" aria-label="Site menu">
          <div className="mobile-drawer-head">
            <span className="mobile-drawer-title">Menu</span>
            <button
              type="button"
              className="mobile-drawer-close"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <nav className="mobile-drawer-nav" aria-label="Topics">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topic/${topic.slug}`}
                onClick={() => setOpen(false)}
              >
                {topic.name}
              </Link>
            ))}
            <Link
              href="/resources"
              className="mobile-drawer-res"
              onClick={() => setOpen(false)}
            >
              Resources
            </Link>
            <Link href="/about" onClick={() => setOpen(false)}>
              About
            </Link>
            <Link
              href="/#nl"
              className="btn btn-solid mobile-drawer-cta"
              onClick={() => setOpen(false)}
            >
              Subscribe
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
