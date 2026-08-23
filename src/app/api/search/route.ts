import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const topicSlug = searchParams.get("topic")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();
  let query = supabase
    .from("articles")
    .select("slug, title, topic:topics(slug, name)")
    .eq("status", "published")
    .ilike("title", `%${q}%`);

  // Scope to one topic — e.g. searching titles within Technology only.
  if (topicSlug) {
    query = query.eq("topic.slug", topicSlug);
  }

  const { data, error } = await query.limit(6);

  if (error) {
    return NextResponse.json({ results: [] }, { status: 500 });
  }

  const results = (data ?? [])
    .map((a) => {
      const topic = Array.isArray(a.topic) ? a.topic[0] : a.topic;
      return { title: a.title, href: `/article/${a.slug}`, topic: topic?.name ?? null, topicSlug: topic?.slug ?? null };
    })
    // Same defensive re-check as getArticlesByTopicSlug — the embedded
    // .eq("topic.slug", ...) filter can leak non-matching rows on some
    // PostgREST versions.
    .filter((r) => !topicSlug || r.topicSlug === topicSlug);

  return NextResponse.json({ results });
}
