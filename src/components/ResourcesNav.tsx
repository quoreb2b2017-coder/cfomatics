"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RESOURCE_SECTIONS } from "@/lib/resources";

export default function ResourcesNav() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      className={`res-drop ${open ? "is-open" : ""}`}
      ref={rootRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link href="/resources" className="res-drop-link" onClick={() => setOpen(false)}>
        Resources
      </Link>
      <button
        type="button"
        className="res-drop-caret"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Resource sections"
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <div className="res-drop-menu" role="menu">
        <Link href="/resources" role="menuitem" onClick={() => setOpen(false)}>
          All resources
        </Link>
        {RESOURCE_SECTIONS.map((section) => (
          <Link key={section.key} href={section.href} role="menuitem" onClick={() => setOpen(false)}>
            <span className="res-drop-n">{section.n}</span>
            {section.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
