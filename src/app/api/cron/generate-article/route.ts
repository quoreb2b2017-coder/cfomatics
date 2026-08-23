import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { researchTopic, writeArticleFromBrief } from "@/lib/ai/generate-article";
import {
  persistGeneratedArticle,
  usedCoverKeys,
} from "@/lib/ai/save-generated";

export const maxDuration = 300;

const DAILY_ARTICLE_COUNT = 2;

type NavbarTopic = { id: string; slug: string; name: string };

/** Prefer navbar topics that have fewer published articles (coverage balance). */
function pickNavbarTopic(
  topics: NavbarTopic[],
  articleCounts: Map<string, number>,
  requestedSlug?: string,
  skipIds?: Set<string>,
): NavbarTopic {
  if (requestedSlug) {
    const hit = topics.find((t) => t.slug === requestedSlug);
    if (!hit) throw new Error(`Unknown topic_slug: ${requestedSlug}`);
    return hit;
  }

  const ranked = topics
    .filter((t) => !skipIds?.has(t.id))
    .sort((a, b) => {
      const ca = articleCounts.get(a.id) ?? 0;
      const cb = articleCounts.get(b.id) ?? 0;
      if (ca !== cb) return ca - cb;
      return a.name.localeCompare(b.name);
    });

  return ranked[0] ?? topics[0];
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  let requestedTopicSlug: string | undefined;
  try {
    const body = await request.json();
    requestedTopicSlug =
      typeof body?.topic_slug === "string" ? body.topic_slug : undefined;
  } catch {
    // Scheduled cron often sends an empty body.
  }

  const runs = requestedTopicSlug ? 1 : DAILY_ARTICLE_COUNT;
  const created: { slug: string; topic: string }[] = [];
  const errors: string[] = [];
  const usedTopicIds = new Set<string>();

  const [{ data: topics }] = await Promise.all([
    supabase.from("topics").select("id, slug, name").order("name"),
  ]);

  if (!topics || topics.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No topics found - run supabase/schema.sql seed first" },
      { status: 500 },
    );
  }

  for (let i = 0; i < runs; i++) {
    let topicSearched: string | null = null;
    try {
      const [{ data: recentArticles }, { data: topicCounts }, excludeKeys] =
        await Promise.all([
          supabase
            .from("articles")
            .select("title")
            .order("created_at", { ascending: false })
            .limit(50),
          supabase.from("articles").select("topic_id").eq("status", "published"),
          usedCoverKeys(supabase),
        ]);

      const counts = new Map<string, number>();
      for (const row of topicCounts ?? []) {
        if (!row.topic_id) continue;
        counts.set(row.topic_id, (counts.get(row.topic_id) ?? 0) + 1);
      }

      const recentTitles = (recentArticles ?? []).map((a) => a.title);
      const selectedTopic = pickNavbarTopic(
        topics,
        counts,
        requestedTopicSlug,
        usedTopicIds,
      );
      usedTopicIds.add(selectedTopic.id);
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

      const inserted = await persistGeneratedArticle(supabase, {
        generated,
        topic: selectedTopic,
        excludeKeys,
      });

      await supabase.from("generation_log").insert({
        topic_searched: topicSearched,
        status: "success",
        article_id: inserted.id,
      });

      created.push({ slug: inserted.slug, topic: selectedTopic.slug });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabase.from("generation_log").insert({
        topic_searched: topicSearched,
        status: "failed",
        error_message: message,
      });
      console.error("generate-article cron failed:", message);
      errors.push(message);
    }
  }

  if (created.length === 0) {
    return NextResponse.json(
      { ok: false, error: errors[0] ?? "Generation failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: errors.length === 0,
    count: created.length,
    articles: created,
    errors: errors.length ? errors : undefined,
  });
}
