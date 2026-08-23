import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { normalizeDashesDeep } from "@/lib/text";
import type { ArticleWithTopic } from "@/types/database";

const PUBLISHED_SELECT = "*, topic:topics(*)";

function sanitizeArticle(article: ArticleWithTopic): ArticleWithTopic {
  return normalizeDashesDeep(article);
}

export const getLatestArticles = cache(
  async (limit = 20): Promise<ArticleWithTopic[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select(PUBLISHED_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getLatestArticles failed:", error.message);
      return [];
    }
    return ((data ?? []) as unknown as ArticleWithTopic[]).map(sanitizeArticle);
  },
);

export const getArticlesByTopicSlug = cache(
  async (topicSlug: string, limit = 30): Promise<ArticleWithTopic[]> => {
    const supabase = await createClient();
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", topicSlug)
      .maybeSingle();

    if (topicError) {
      console.error("getArticlesByTopicSlug topic lookup failed:", topicError.message);
      return [];
    }
    if (!topic) return [];

    const { data, error } = await supabase
      .from("articles")
      .select(PUBLISHED_SELECT)
      .eq("status", "published")
      .eq("topic_id", topic.id)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getArticlesByTopicSlug failed:", error.message);
      return [];
    }

    return ((data ?? []) as unknown as ArticleWithTopic[])
      .filter((a) => a.topic?.slug === topicSlug)
      .map(sanitizeArticle);
  },
);

/** Fill a homepage/topic row to `count` cards, topic stories first. */
export function fillArticleRow(
  primary: ArticleWithTopic[],
  pool: ArticleWithTopic[],
  count = 3,
  excludeIds: Iterable<string> = [],
): ArticleWithTopic[] {
  const out: ArticleWithTopic[] = [];
  const used = new Set(excludeIds);
  for (const list of [primary, pool]) {
    for (const article of list) {
      if (out.length >= count) return out;
      if (used.has(article.id)) continue;
      out.push(article);
      used.add(article.id);
    }
  }
  return out;
}

export const getArticleBySlug = cache(
  async (slug: string): Promise<ArticleWithTopic | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select(PUBLISHED_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("getArticleBySlug failed:", error.message);
      return null;
    }
    if (!data) return null;
    return sanitizeArticle(data as unknown as ArticleWithTopic);
  },
);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
