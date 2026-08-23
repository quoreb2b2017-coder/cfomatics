import { createClient } from "@supabase/supabase-js";
import {
  applySeoLimitsToArticle,
  articleSeoChanged,
  SEO_LIMITS,
} from "../src/lib/seo.ts";
import type { ArticleBody } from "../src/types/database.ts";

type Row = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  meta_title: string | null;
  meta_description: string | null;
  body_json: ArticleBody;
  topic: { name: string } | { name: string }[] | null;
};

function topicName(topic: Row["topic"]): string | null {
  if (!topic) return null;
  if (Array.isArray(topic)) return topic[0]?.name ?? null;
  return topic.name;
}

function overLimit(label: string, value: string, max: number): string | null {
  return value.length > max ? `${label} ${value.length}>${max}` : null;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
  .from("articles")
  .select(
    "id, slug, title, dek, meta_title, meta_description, body_json, topic:topics(name)",
  )
  .order("created_at", { ascending: true });

if (error) {
  console.error(error.message);
  process.exit(1);
}

const rows = (data ?? []) as Row[];
let updated = 0;

for (const row of rows) {
  const next = applySeoLimitsToArticle(row, topicName(row.topic));
  if (!articleSeoChanged(row, next)) continue;

  const flags = [
    overLimit("h1", row.title, SEO_LIMITS.h1),
    overLimit("meta_title", row.meta_title ?? "", SEO_LIMITS.metaTitle),
    overLimit(
      "meta_desc",
      row.meta_description ?? "",
      SEO_LIMITS.metaDescription,
    ),
    overLimit("og", row.body_json?.seo?.og_title ?? "", SEO_LIMITS.ogTitle),
    overLimit("aeo", row.body_json?.seo?.aeo_answer ?? "", SEO_LIMITS.aeoAnswer),
    overLimit(
      "geo",
      row.body_json?.seo?.geo_summary ?? "",
      SEO_LIMITS.geoSummary,
    ),
    overLimit(
      "keywords",
      row.body_json?.seo?.keywords ?? "",
      SEO_LIMITS.keywords,
    ),
    overLimit(
      "focus",
      row.body_json?.seo?.focus_keyword ?? "",
      SEO_LIMITS.focusKeyword,
    ),
  ].filter(Boolean);

  const { error: updateError } = await supabase
    .from("articles")
    .update({
      title: next.title,
      meta_title: next.meta_title,
      meta_description: next.meta_description,
      body_json: next.body_json,
    })
    .eq("id", row.id);

  if (updateError) {
    console.error(`FAIL ${row.slug}: ${updateError.message}`);
    continue;
  }

  updated += 1;
  console.log(
    `fixed ${row.slug}${flags.length ? ` (${flags.join(", ")})` : " (filled/clamped SEO)"}`,
  );
}

console.log(`Done. Updated ${updated} of ${rows.length} articles.`);
