import "server-only";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/articles";
import { pexelsPhotoKey, searchPexelsPhoto } from "@/lib/ai/pexels";
import {
  researchTitle,
  writeArticleFromBrief,
  type GeneratedArticle,
  type NavbarTopic,
} from "@/lib/ai/generate-article";
import { SEO_LIMITS, clampGeneratedSeoFields, clampToLimit } from "@/lib/seo";
import type {
  ArticleSource,
  ArticleStatus,
  Database,
} from "@/types/database";

type CmsClient = SupabaseClient<Database>;

export async function uniqueSlug(
  supabase: CmsClient,
  base: string,
): Promise<string> {
  const slug = slugify(base);
  const { data } = await supabase
    .from("articles")
    .select("slug")
    .like("slug", `${slug}%`);

  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(slug)) return slug;

  for (let i = 2; i < 50; i++) {
    const candidate = `${slug}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

export async function usedCoverKeys(
  supabase: CmsClient,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("articles")
    .select("cover_image_url")
    .not("cover_image_url", "is", null);

  const keys = new Set<string>();
  for (const row of data ?? []) {
    const key = pexelsPhotoKey(row.cover_image_url);
    if (key) keys.add(key);
  }
  return keys;
}

export async function persistGeneratedArticle(
  supabase: CmsClient,
  args: {
    generated: GeneratedArticle;
    topic: NavbarTopic;
    status?: ArticleStatus;
    source?: ArticleSource;
    excludeKeys?: Set<string>;
  },
): Promise<{ id: string; slug: string; title: string }> {
  const generated = clampGeneratedSeoFields(args.generated);
  const status = args.status ?? "published";
  const excludeKeys = args.excludeKeys ?? (await usedCoverKeys(supabase));
  const slug = await uniqueSlug(
    supabase,
    generated.slug || generated.title,
  );
  const image = await searchPexelsPhoto(generated.image_search_query, {
    excludeKeys,
    pageSalt: slug,
  });

  const { data: inserted, error: insertError } = await supabase
    .from("articles")
    .insert({
      slug,
      title: generated.title,
      dek: generated.dek,
      body_json: {
        ...generated.body,
        seo: {
          focus_keyword: generated.focus_keyword,
          og_title: generated.og_title,
          keywords: generated.seo_keywords,
          aeo_answer: generated.aeo_answer,
          geo_summary: generated.geo_summary,
        },
      },
      topic_id: args.topic.id,
      status,
      cover_image_url: image?.url ?? null,
      cover_image_alt: image?.alt ?? generated.title,
      cover_image_credit: image?.photographer ?? null,
      cover_image_credit_url: image?.photographerUrl ?? null,
      meta_title: generated.meta_title,
      meta_description: generated.meta_description,
      read_time_minutes: generated.read_time_minutes,
      source: args.source ?? "ai",
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id, slug, title")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Article insert returned no row");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  revalidatePath(`/topic/${args.topic.slug}`);
  revalidatePath(`/article/${inserted.slug}`);
  revalidatePath("/sitemap.xml");

  return inserted;
}

/** Admin path: user picks a topic + title; we research, write, cover, and SEO. */
export async function generateAndSaveFromTitle(
  supabase: CmsClient,
  input: {
    topicId: string;
    title: string;
    status: ArticleStatus;
  },
): Promise<{ id: string; slug: string; title: string; topic: string }> {
  const title = clampToLimit(input.title.trim(), SEO_LIMITS.h1);
  if (title.length < 8) {
    throw new Error("Title is too short");
  }

  const [{ data: topics }, { data: recentArticles }] = await Promise.all([
    supabase.from("topics").select("id, slug, name").order("name"),
    supabase
      .from("articles")
      .select("title")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!topics || topics.length === 0) {
    throw new Error("No topics found");
  }

  const topic = topics.find((t) => t.id === input.topicId);
  if (!topic) {
    throw new Error("Unknown topic");
  }

  const recentTitles = (recentArticles ?? []).map((a) => a.title);
  const researchBrief = await researchTitle(
    title,
    recentTitles,
    topic,
    topics,
  );
  const generated = await writeArticleFromBrief(
    researchBrief,
    topics.map((t) => t.slug),
    topic.slug,
    { forcedTitle: title },
  );

  const saved = await persistGeneratedArticle(supabase, {
    generated,
    topic,
    status: input.status,
    source: "ai",
  });

  return { ...saved, topic: topic.slug };
}
