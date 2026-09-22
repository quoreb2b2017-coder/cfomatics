import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { getTopics } from "@/lib/topics";
import type { ArticleWithTopic, Topic } from "@/types/database";

const HOME_CARD_SELECT =
  "id, slug, title, dek, author_name, published_at, read_time_minutes, cover_image_url, cover_image_alt, topic_id, topic:topics(id, slug, name, description, created_at)";

export type HomepageArticle = Pick<
  ArticleWithTopic,
  | "id"
  | "slug"
  | "title"
  | "dek"
  | "author_name"
  | "published_at"
  | "read_time_minutes"
  | "cover_image_url"
  | "cover_image_alt"
  | "topic_id"
> & { topic: Topic | null };

export type HomepageData = {
  topics: Topic[];
  latest: HomepageArticle[];
  topicSections: Array<{ topic: Topic; articles: HomepageArticle[] }>;
};

function asCard(row: unknown): HomepageArticle {
  // Content is already dash-normalized on write; skip deep walk for speed.
  return row as HomepageArticle;
}

async function loadHomepageData(): Promise<HomepageData> {
  const supabase = createPublicClient();
  const nowIso = new Date().toISOString();

  const [topics, articlesResult] = await Promise.all([
    getTopics(),
    supabase
      .from("articles")
      .select(HOME_CARD_SELECT)
      .eq("status", "published")
      .not("published_at", "is", null)
      .lte("published_at", nowIso)
      .order("published_at", { ascending: false })
      .limit(36),
  ]);

  if (articlesResult.error) {
    console.error("getHomepageData failed:", articlesResult.error.message);
  }

  const latest = ((articlesResult.data ?? []) as unknown[]).map(asCard);

  const byTopic = new Map<string, HomepageArticle[]>();
  for (const article of latest) {
    const key = article.topic_id;
    if (!key) continue;
    const bucket = byTopic.get(key);
    if (bucket) {
      if (bucket.length < 3) bucket.push(article);
    } else {
      byTopic.set(key, [article]);
    }
  }

  const topicSections = topics
    .map((topic) => ({
      topic,
      articles: byTopic.get(topic.id) ?? [],
    }))
    .filter((s) => s.articles.length > 0);

  return { topics, latest, topicSections };
}

const fetchHomepageCached = unstable_cache(
  loadHomepageData,
  ["cfomatics-homepage-v2"],
  { revalidate: 60, tags: ["homepage", "articles"] },
);

export const getHomepageData = cache(async (): Promise<HomepageData> =>
  fetchHomepageCached(),
);
