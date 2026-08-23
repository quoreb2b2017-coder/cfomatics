import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { researchTopic, writeArticleFromBrief } from "@/lib/ai/generate-article";
import { pexelsPhotoKey, searchPexelsPhoto } from "@/lib/ai/pexels";
import { slugify } from "@/lib/articles";

export const maxDuration = 300;

async function uniqueSlug(
  supabase: ReturnType<typeof createAdminClient>,
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

async function usedCoverKeys(
  supabase: ReturnType<typeof createAdminClient>,
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

/** Prefer navbar topics that have fewer published articles (coverage balance). */
function pickNavbarTopic<T extends { id: string; slug: string; name: string }>(
  topics: T[],
  articleCounts: Map<string, number>,
  requestedSlug?: string,
): T {
  if (requestedSlug) {
    const hit = topics.find((t) => t.slug === requestedSlug);
    if (!hit) throw new Error(`Unknown topic_slug: ${requestedSlug}`);
    return hit;
  }

  const ranked = [...topics].sort((a, b) => {
    const ca = articleCounts.get(a.id) ?? 0;
    const cb = articleCounts.get(b.id) ?? 0;
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name);
  });
  return ranked[0];
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  let topicSearched: string | null = null;

  try {
    const [{ data: recentArticles }, { data: topics }, { data: topicCounts }, excludeKeys] =
      await Promise.all([
        supabase
          .from("articles")
          .select("title")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("topics").select("id, slug, name").order("name"),
        supabase.from("articles").select("topic_id").eq("status", "published"),
        usedCoverKeys(supabase),
      ]);

    if (!topics || topics.length === 0) {
      throw new Error("No topics found — run supabase/schema.sql seed first");
    }

    const counts = new Map<string, number>();
    for (const row of topicCounts ?? []) {
      if (!row.topic_id) continue;
      counts.set(row.topic_id, (counts.get(row.topic_id) ?? 0) + 1);
    }

    const recentTitles = (recentArticles ?? []).map((a) => a.title);

    let requestedTopicSlug: string | undefined;
    try {
      const body = await request.json();
      requestedTopicSlug =
        typeof body?.topic_slug === "string" ? body.topic_slug : undefined;
    } catch {
      // Scheduled cron often sends an empty body.
    }

    const selectedTopic = pickNavbarTopic(
      topics,
      counts,
      requestedTopicSlug,
    );
    topicSearched = `${selectedTopic.name}: researching trending coverage`;

    const researchBrief = await researchTopic(
      recentTitles,
      selectedTopic,
      topics,
    );
    const generated = await writeArticleFromBrief(
      researchBrief,
      topics.map((t) => t.slug),
      selectedTopic.slug,
    );
    topicSearched = `${selectedTopic.name}: ${generated.title}`;

    const slug = await uniqueSlug(supabase, generated.slug || generated.title);
    const image = await searchPexelsPhoto(generated.image_search_query, {
      excludeKeys,
      pageSalt: slug,
    });

    // Prefer dedicated OG title for social; fall back to meta/H1.
    const metaTitle = generated.meta_title;
    const metaDescription = generated.meta_description;

    const { data: inserted, error: insertError } = await supabase
      .from("articles")
      .insert({
        slug,
        title: generated.title,
        dek: generated.dek,
        body_json: {
          ...generated.body,
          // Stash SEO extras without a schema migration — article page
          // still uses title as H1; generateMetadata prefers meta_* fields.
          seo: {
            focus_keyword: generated.focus_keyword,
            og_title: generated.og_title,
          },
        },
        topic_id: selectedTopic.id,
        status: "published",
        cover_image_url: image?.url ?? null,
        cover_image_alt: image?.alt ?? generated.title,
        cover_image_credit: image?.photographer ?? null,
        cover_image_credit_url: image?.photographerUrl ?? null,
        meta_title: metaTitle,
        meta_description: metaDescription,
        read_time_minutes: generated.read_time_minutes,
        source: "ai",
        published_at: new Date().toISOString(),
      })
      .select("id, slug")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "Article insert returned no row");
    }

    await supabase.from("generation_log").insert({
      topic_searched: topicSearched,
      status: "success",
      article_id: inserted.id,
    });

    revalidatePath("/");
    revalidatePath(`/topic/${selectedTopic.slug}`);
    revalidatePath(`/article/${inserted.slug}`);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      ok: true,
      slug: inserted.slug,
      topic: selectedTopic.slug,
      focus_keyword: generated.focus_keyword,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from("generation_log").insert({
      topic_searched: topicSearched,
      status: "failed",
      error_message: message,
    });
    console.error("generate-article cron failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
