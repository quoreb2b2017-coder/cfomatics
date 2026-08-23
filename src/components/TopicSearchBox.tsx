"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SearchHit {
  title: string;
  href: string;
}

export default function TopicSearchBox({
  topicSlug,
  topicName,
}: {
  topicSlug: string;
  topicName: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&topic=${encodeURIComponent(topicSlug)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        // aborted — next keystroke supersedes this request
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, topicSlug]);

  return (
    <div className="topic-search">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search titles in ${topicName}…`}
        aria-label={`Search titles in ${topicName}`}
      />
      {query.trim().length >= 2 && (
        <div className="topic-search-results">
          {results.length === 0 ? (
            <p className="search-empty">No {topicName} titles match &ldquo;{query}&rdquo;</p>
          ) : (
            results.map((r) => (
              <Link key={r.href} href={r.href} className="search-hit">
                <span className="search-hit-title">{r.title}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
