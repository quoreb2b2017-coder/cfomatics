"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/articles";
import { normalizeDashes, normalizeDashesDeep } from "@/lib/text";
import {
  SEO_LIMITS,
  clampKeywordList,
  clampMetaTitle,
  clampToLimit,
} from "@/lib/seo";
import type { ArticleBody, ArticleStatus } from "@/types/database";

function parseBody(formData: FormData): ArticleBody {
  const raw = String(formData.get("sections_json") ?? "[]");
  let sections: ArticleBody["sections"] = [];
  try {
    sections = JSON.parse(raw);
  } catch {
    sections = [];
  }

  const takeawaysRaw = String(formData.get("takeaways") ?? "").trim();
  const takeaways = takeawaysRaw
    ? takeawaysRaw.split("\n").map((l) => l.trim()).filter(Boolean)
    : undefined;

  const pullQuote = String(formData.get("pullQuote") ?? "").trim() || undefined;

  const ogTitle = clampToLimit(
    normalizeDashes(String(formData.get("og_title") ?? "")).trim(),
    SEO_LIMITS.ogTitle,
  );
  const focusKeyword = clampToLimit(
    String(formData.get("focus_keyword") ?? "").trim(),
    SEO_LIMITS.focusKeyword,
  );
  const keywords = clampKeywordList(
    String(formData.get("seo_keywords") ?? "").trim(),
  );
  const aeoAnswer = clampToLimit(
    normalizeDashes(String(formData.get("aeo_answer") ?? "")).trim(),
    SEO_LIMITS.aeoAnswer,
  );
  const geoSummary = clampToLimit(
    normalizeDashes(String(formData.get("geo_summary") ?? "")).trim(),
    SEO_LIMITS.geoSummary,
  );
  const seo =
    ogTitle || focusKeyword || keywords || aeoAnswer || geoSummary
      ? {
          og_title: ogTitle || undefined,
          focus_keyword: focusKeyword || undefined,
          keywords: keywords || undefined,
          aeo_answer: aeoAnswer || undefined,
          geo_summary: geoSummary || undefined,
        }
      : undefined;

  // Charts are AI-generated only (no manual chart editor in this form yet) -
  // pass through whatever the form was hydrated with so editing an
  // AI-written article doesn't silently drop its chart.
  let chart: ArticleBody["chart"];
  const chartRaw = String(formData.get("chart_json") ?? "");
  if (chartRaw) {
    try {
      chart = JSON.parse(chartRaw);
    } catch {
      chart = undefined;
    }
  }

  return normalizeDashesDeep({
    lede: String(formData.get("lede") ?? ""),
    sections,
    pullQuote,
    takeaways,
    chart,
    seo,
  });
}

function articleFields(formData: FormData) {
  const title = clampToLimit(
    normalizeDashes(String(formData.get("title") ?? "")),
    SEO_LIMITS.h1,
  );
  const status = String(formData.get("status") ?? "draft") as ArticleStatus;
  const readTime = Number(formData.get("read_time_minutes") ?? 5);

  return {
    title,
    dek: normalizeDashes(String(formData.get("dek") ?? "")),
    topic_id: String(formData.get("topic_id") ?? "") || null,
    status,
    meta_title:
      clampMetaTitle(
        normalizeDashes(String(formData.get("meta_title") ?? "")),
      ) || clampMetaTitle(title),
    meta_description: clampToLimit(
      normalizeDashes(String(formData.get("meta_description") ?? "")),
      SEO_LIMITS.metaDescription,
    ),
    read_time_minutes: Number.isFinite(readTime) ? readTime : 5,
    cover_image_url: String(formData.get("cover_image_url") ?? "") || null,
    cover_image_alt:
      normalizeDashes(String(formData.get("cover_image_alt") ?? "")) || null,
    cover_image_credit:
      String(formData.get("cover_image_credit") ?? "") || null,
    cover_image_credit_url:
      String(formData.get("cover_image_credit_url") ?? "") || null,
    body_json: parseBody(formData),
    published_at:
      status === "published" ? new Date().toISOString() : null,
  };
}

export async function createArticle(formData: FormData) {
  const supabase = await createClient();
  const fields = articleFields(formData);
  const slug = slugify(String(formData.get("slug") ?? "") || fields.title);

  const { error } = await supabase.from("articles").insert({
    ...fields,
    slug,
    source: "manual",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/articles");
  redirect("/admin/articles");
}

export async function updateArticle(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = articleFields(formData);

  const { data: existing } = await supabase
    .from("articles")
    .select("slug, published_at, status")
    .eq("id", id)
    .maybeSingle();

  const slug = slugify(String(formData.get("slug") ?? "") || fields.title);

  // Don't clobber an already-set published_at when just re-saving a
  // published article (only stamp it the moment status flips to published).
  const publishedAt =
    fields.status === "published"
      ? (existing?.status === "published" && existing.published_at) ||
        new Date().toISOString()
      : null;

  const { error } = await supabase
    .from("articles")
    .update({ ...fields, slug, published_at: publishedAt })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/articles");
  if (existing?.slug) revalidatePath(`/article/${existing.slug}`);
  if (slug !== existing?.slug) revalidatePath(`/article/${slug}`);
  redirect("/admin/articles");
}

export async function deleteArticle(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("articles")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/articles");
  if (existing?.slug) revalidatePath(`/article/${existing.slug}`);
}

export async function toggleArticleStatus(id: string, next: ArticleStatus) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("articles")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("articles")
    .update({
      status: next,
      published_at: next === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/articles");
  if (existing?.slug) revalidatePath(`/article/${existing.slug}`);
}
