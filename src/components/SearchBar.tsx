"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface SearchHit {
  title: string;
  href: string;
  topic: string | null;
}

export default function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        // aborted or network error - ignore, next keystroke will retry
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) closeSearch();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [closeSearch]);

  return (
    <div className={`search ${open ? "is-open" : ""}`} ref={wrapRef}>
      {!open ? (
        <button
          type="button"
          className="icon-btn"
          aria-label="Open search"
          onClick={() => setOpen(true)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
        </button>
      ) : (
        <form
          className="search-form"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (results[0]) {
              router.push(results[0].href);
              closeSearch();
            }
          }}
        >
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories, topics…"
            aria-label="Search CFOmatics"
            autoComplete="off"
          />
          <kbd className="search-kbd">Esc</kbd>
          <button
            type="button"
            className="search-close"
            aria-label="Close search"
            onClick={closeSearch}
          >
            ×
          </button>
          {query.trim().length >= 2 && (
            <div className="search-panel" role="listbox">
              {results.length === 0 ? (
                <p className="search-empty">No matches for &ldquo;{query}&rdquo;</p>
              ) : (
                results.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="search-hit"
                    role="option"
                    onClick={() => setOpen(false)}
                  >
                    {item.topic && (
                      <span className="search-hit-topic">{item.topic}</span>
                    )}
                    <span className="search-hit-title">{item.title}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
