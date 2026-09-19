import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { getSiteUrl } from "@/lib/site";
import type { ArticleBody } from "@/types/database";

const FEED_LIMIT = 500;

export type RssArticle = {
  slug: string;
  title: string;
  dek: string;
  author_name: string;
  published_at: string | null;
  updated_at: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  body_json: ArticleBody | null;
  topic: { name: string; slug: string } | null;
};

export async function getPublishedArticlesForRss(): Promise<RssArticle[]> {
  const supabase = createPublicClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("articles")
    .select(
      "slug, title, dek, author_name, published_at, updated_at, cover_image_url, cover_image_alt, body_json, topic:topics(name, slug)",
    )
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", nowIso)
    .order("published_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (error) {
    console.error("getPublishedArticlesForRss failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const topic = Array.isArray(row.topic) ? row.topic[0] ?? null : row.topic;
    return {
      slug: row.slug,
      title: row.title,
      dek: row.dek,
      author_name: row.author_name,
      published_at: row.published_at,
      updated_at: row.updated_at,
      cover_image_url: row.cover_image_url,
      cover_image_alt: row.cover_image_alt,
      body_json: (row.body_json as ArticleBody | null) ?? null,
      topic: topic ? { name: topic.name, slug: topic.slug } : null,
    };
  });
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toRfc822(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

function absoluteUrl(
  site: string,
  maybeUrl: string | null | undefined,
): string | null {
  if (!maybeUrl) return null;
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
  return `${site}${maybeUrl.startsWith("/") ? "" : "/"}${maybeUrl}`;
}

function itemHtml(article: RssArticle): string {
  const lede = article.body_json?.lede?.trim();
  const dek = article.dek.trim();
  const summary = lede || dek || article.title;
  let html = `<p>${escapeXml(summary)}</p>`;
  if (lede && dek && lede !== dek) {
    html += `\n<p>${escapeXml(dek)}</p>`;
  }
  return html;
}

function imageXml(site: string, article: RssArticle): string {
  const image = absoluteUrl(site, article.cover_image_url);
  if (!image) return "";

  const alt = article.cover_image_alt?.trim();
  const media = alt
    ? `      <media:content url="${escapeXml(image)}" medium="image">
        <media:title type="plain">${escapeXml(alt)}</media:title>
        <media:description type="plain">${escapeXml(alt)}</media:description>
      </media:content>`
    : `      <media:content url="${escapeXml(image)}" medium="image" />`;

  return `
      <enclosure url="${escapeXml(image)}" type="image/jpeg" length="0" />
${media}`;
}

export async function buildRssXml(): Promise<string> {
  const site = getSiteUrl();
  const articles = await getPublishedArticlesForRss();
  const lastBuild =
    articles[0]?.updated_at ||
    articles[0]?.published_at ||
    new Date().toISOString();

  const items = articles
    .map((a) => {
      const link = `${site}/article/${a.slug}`;
      const description = a.dek || a.body_json?.lede || a.title;
      const author = a.author_name || "The CFOmatics Desk";
      const category = a.topic?.name;

      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${toRfc822(a.published_at)}</pubDate>
      <dc:creator>${escapeXml(author)}</dc:creator>
      <description>${escapeXml(description)}</description>
      <content:encoded><![CDATA[${itemHtml(a)}]]></content:encoded>${
        category ? `\n      <category>${escapeXml(category)}</category>` : ""
      }${imageXml(site, a)}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>CFOmatics</title>
    <link>${escapeXml(site)}</link>
    <description>Financial news and analysis for CFOs and finance leaders across reporting, FP&amp;A, treasury, risk, tax, technology, and leadership.</description>
    <language>en-us</language>
    <lastBuildDate>${toRfc822(lastBuild)}</lastBuildDate>
    <atom:link href="${escapeXml(`${site}/feed.xml`)}" rel="self" type="application/rss+xml" />
    <copyright>© ${new Date().getUTCFullYear()} CFOmatics. Published by Quore B2B Marketing.</copyright>
    <managingEditor>editorial@cfomatics.com (The CFOmatics Desk)</managingEditor>
    <webMaster>editorial@cfomatics.com (The CFOmatics Desk)</webMaster>
${items}
  </channel>
</rss>
`;
}

export function rssResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
