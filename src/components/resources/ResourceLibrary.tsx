"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CopyLinkButton from "@/components/CopyLinkButton";
import { VERTICALS, categoryLabel, detailPath, downloadPath } from "@/lib/resources";
import { getPublicSiteUrl, linkedInShareUrl } from "@/lib/public-site";
import type { ResourceItem } from "@/types/database";

export default function ResourceLibrary({ items }: { items: ResourceItem[] }) {
  const [query, setQuery] = useState("");
  const [vertical, setVertical] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (vertical && item.vertical_slug !== vertical) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.vertical.toLowerCase().includes(q)
      );
    });
  }, [items, query, vertical]);

  return (
    <div className="wrap res-library">
      <div className="res-filters">
        <label>
          <span className="sr-only">Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            type="search"
          />
        </label>
        <label>
          <span className="sr-only">Vertical</span>
          <select value={vertical} onChange={(event) => setVertical(event.target.value)}>
            <option value="">All verticals</option>
            {VERTICALS.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {visible.length === 0 ? (
        <p className="res-empty">Nothing matches that search.</p>
      ) : (
        <div className="res-cards">
          {visible.map((item) => {
            const href = detailPath(item.category, item.slug);
            const fileHref = downloadPath(item.category, item.slug);
            const shareUrl = `${getPublicSiteUrl()}${href}`;
            const kind = categoryLabel(item.category);
            return (
              <article key={item.id} className="res-card">
                <div className="res-card-cover">
                  {item.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.cover_url} alt="" />
                  ) : (
                    <div className="res-card-fallback" />
                  )}
                  <div className="res-card-hover">
                    <Link href={fileHref} className="res-card-download">
                      Download
                    </Link>
                    <Link href={href} className="res-card-view">
                      View details
                    </Link>
                  </div>
                </div>
                <div className="res-card-body">
                  <p className="res-card-cat">{kind}</p>
                  <p className="res-card-vertical">{item.vertical}</p>
                  <h2>
                    <Link href={href}>{item.title}</Link>
                  </h2>
                  <div className="res-card-links">
                    <Link href={href}>View {kind.toLowerCase()}</Link>
                    <Link href={fileHref}>Free PDF →</Link>
                  </div>
                  <p className="res-card-share-label">Share this {kind.toLowerCase()}</p>
                  <div className="res-card-share">
                    <CopyLinkButton className="res-share-btn" url={shareUrl} />
                    <a
                      className="res-share-btn res-share-btn--in"
                      href={linkedInShareUrl(shareUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on LinkedIn"
                    >
                      <LinkedInMark />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z"
      />
    </svg>
  );
}
