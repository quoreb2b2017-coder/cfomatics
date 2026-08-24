import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";

/** Rebuild at least every minute; publish paths also call revalidateSitemap(). */
export const revalidate = 60;

function lastMod(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Pexels query strings contain `&`, which breaks sitemap XML if left raw. */
function sitemapImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.split("?")[0]?.split("#")[0] || undefined;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const nowIso = new Date().toISOString();
  const supabase = createPublicClient();

  const [{ data: articles }, { data: topics }] = await Promise.all([
    supabase
      .from("articles")
      .select("slug, updated_at, published_at, cover_image_url")
      .eq("status", "published")
      .not("published_at", "is", null)
      .lte("published_at", nowIso)
      .order("published_at", { ascending: false }),
    supabase.from("topics").select("slug").order("name"),
  ]);

  const published = articles ?? [];
  const newest = published[0]?.updated_at ?? published[0]?.published_at;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: site,
      lastModified: lastMod(newest) ?? new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${site}/about`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${site}/resources`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const topicPages: MetadataRoute.Sitemap = (topics ?? []).map((t) => ({
    url: `${site}/topic/${t.slug}`,
    lastModified: lastMod(newest),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const articlePages: MetadataRoute.Sitemap = published.map((a) => {
    const publishedAt = lastMod(a.published_at);
    const ageMs = publishedAt ? Date.now() - publishedAt.getTime() : Infinity;
    const fresh = ageMs < 1000 * 60 * 60 * 24 * 3;

    const image = sitemapImageUrl(a.cover_image_url);

    return {
      url: `${site}/article/${a.slug}`,
      lastModified: lastMod(a.updated_at) ?? publishedAt,
      changeFrequency: fresh ? "daily" : "weekly",
      priority: fresh ? 0.9 : 0.7,
      images: image ? [image] : undefined,
    };
  });

  return [...staticPages, ...topicPages, ...articlePages];
}
