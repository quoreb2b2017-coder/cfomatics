const PRODUCTION_SITE_URL = "https://www.cfomatics.com";

export const CFOMATICS_LINKEDIN_URL =
  "https://www.linkedin.com/showcase/cfomatics/posts/";

export function linkedInShareUrl(pageUrl: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
}

function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/** Public origin LinkedIn can crawl. Local dev must not share localhost. */
export function getPublicSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  if (raw && !isLocalhostUrl(raw)) return raw;
  return PRODUCTION_SITE_URL;
}

export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

  // NEXT_PUBLIC_* is inlined at build time. If Vercel still has
  // localhost from .env.example, never emit that into sitemap/robots.
  if (process.env.VERCEL_ENV === "production") {
    if (raw && !isLocalhostUrl(raw)) return raw;
    return PRODUCTION_SITE_URL;
  }

  if (raw) return raw;
  if (process.env.NODE_ENV === "production") return PRODUCTION_SITE_URL;
  return "http://localhost:3000";
}
