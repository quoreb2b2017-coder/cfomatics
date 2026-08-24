import { revalidatePath } from "next/cache";

const PRODUCTION_SITE_URL = "https://www.cfomatics.com";

function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
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

/** Bust cached sitemap after publish / unpublish / delete. */
export function revalidateSitemap() {
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
}
