import Link from "next/link";
import type { ReactNode } from "react";
import CopyLinkButton from "@/components/CopyLinkButton";
import ReadFullDescription from "@/components/resources/ReadFullDescription";
import { categoryLabel, detailPath, SITE_NAME } from "@/lib/resources";
import { getPublicSiteUrl, linkedInShareUrl } from "@/lib/public-site";
import type { ResourceItem } from "@/types/database";

export default function ResourceSplit({
  resource,
  sectionLabel,
  sectionHref,
  children,
}: {
  resource: ResourceItem;
  sectionLabel: string;
  sectionHref: string;
  children: ReactNode;
}) {
  const kind = categoryLabel(resource.category);
  const offered = resource.offered_by || SITE_NAME;
  const shareUrl = `${getPublicSiteUrl()}${detailPath(resource.category, resource.slug)}`;

  return (
    <article className="wrap res-detail">
      <nav className="res-crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden> / </span>
        <Link href="/resources">Resources</Link>
        <span aria-hidden> / </span>
        <Link href={sectionHref}>{sectionLabel}</Link>
      </nav>
      <div className="res-detail-grid">
        <div className="res-detail-cover">
          {resource.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resource.cover_url} alt="" />
          ) : (
            <div className="res-card-fallback" />
          )}
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
        <div className="res-detail-main">
          <div className="res-pills">
            <span>{kind}</span>
            <span className="res-pill-blue">{resource.vertical}</span>
          </div>
          <p className="res-request">Request your free {kind.toLowerCase()}:</p>
          <h1>{resource.title}</h1>
          {resource.description ? <p className="res-lede">{resource.description}</p> : null}
          {children}
        </div>
      </div>
      <div className="res-after">
        <dl className="res-meta">
          <div>
            <dt>Offered free by</dt>
            <dd>{offered}</dd>
          </div>
          <div>
            <dt>See all resources from</dt>
            <dd>
              <Link href={sectionHref}>{offered}</Link>
            </dd>
          </div>
          {resource.author_name ? (
            <div>
              <dt>Author</dt>
              <dd>{resource.author_name}</dd>
            </div>
          ) : null}
        </dl>
        <p>
          <Link href={sectionHref} className="res-back">
            ← Back to library
          </Link>
        </p>
        <ReadFullDescription description={resource.overview || resource.description} sections={resource.inside_sections} />
      </div>
    </article>
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
