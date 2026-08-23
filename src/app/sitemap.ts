import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cfomatics.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: articles }, { data: topics }] = await Promise.all([
    supabase
      .from("articles")
      .select("slug, updated_at")
      .eq("status", "published"),
    supabase.from("topics").select("slug"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/resources`, changeFrequency: "weekly", priority: 0.5 },
  ];

  const topicPages: MetadataRoute.Sitemap = (topics ?? []).map((t) => ({
    url: `${SITE_URL}/topic/${t.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const articlePages: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${SITE_URL}/article/${a.slug}`,
    lastModified: a.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...topicPages, ...articlePages];
}
