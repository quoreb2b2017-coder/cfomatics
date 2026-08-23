import { revalidatePath } from "next/cache";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cfomatics.com";
  return raw.replace(/\/+$/, "");
}

/** Bust cached sitemap after publish / unpublish / delete. */
export function revalidateSitemap() {
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
}
