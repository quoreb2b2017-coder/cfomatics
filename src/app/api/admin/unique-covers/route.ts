import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { pexelsPhotoKey, searchPexelsPhoto } from "@/lib/ai/pexels";

export const maxDuration = 300;

/**
 * Body: { "force": true } regenerates EVERY article cover via Pexels.
 * Without force, only missing/duplicate covers are fixed.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronOk = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!cronOk) {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let force = false;
  try {
    const body = await request.json();
    force = body?.force === true;
  } catch {
    // empty body = duplicates/missing only
  }

  const supabase = createAdminClient();
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, slug, title, dek, cover_image_url, topic:topics(name, slug)")
    .order("published_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const used = new Set<string>();
  const updates: { id: string; slug: string; reason: string }[] = [];
  const skipped: string[] = [];
  const failed: { slug: string; error: string }[] = [];

  // When not forcing, seed `used` with covers we will keep so replacements
  // don't collide with already-unique images.
  if (!force) {
    for (const article of articles ?? []) {
      const key = pexelsPhotoKey(article.cover_image_url);
      if (!key) continue;
      // First occurrence of each key is "kept"; later ones are duplicates.
      if (!used.has(key)) used.add(key);
    }
    // Rebuild: we'll re-walk and only replace missing/dupes. Clear and
    // track properly in the loop instead.
    used.clear();
  }

  for (const article of articles ?? []) {
    const key = pexelsPhotoKey(article.cover_image_url);
    const missing = !article.cover_image_url;
    const duplicate = !!(key && used.has(key));
    const needsNew = force || missing || duplicate;

    if (!needsNew && key) {
      used.add(key);
      skipped.push(article.slug);
      continue;
    }

    const topic = article.topic as { name?: string; slug?: string } | null;
    const topicName = topic?.name ?? "finance";
    const titleWords = article.title
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 4)
      .join(" ");

    const queries = [
      `${topicName} ${titleWords}`.trim(),
      `${titleWords} business`.trim(),
      `${topicName} corporate finance`,
      `executive ${topic?.slug ?? "finance"} office`,
      "modern office finance",
    ].filter((q) => q.length > 3);

    let image = null;
    let lastErr: unknown = null;

    for (const query of queries) {
      try {
        image = await searchPexelsPhoto(query, {
          excludeKeys: used,
          pageSalt: `${article.slug}-${query}`,
        });
        if (image) break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!image) {
      if (force || duplicate) {
        await supabase
          .from("articles")
          .update({
            cover_image_url: null,
            cover_image_alt: article.title,
            cover_image_credit: null,
            cover_image_credit_url: null,
          })
          .eq("id", article.id);
        updates.push({
          id: article.id,
          slug: article.slug,
          reason: "cleared-no-pexels",
        });
      }
      failed.push({
        slug: article.slug,
        error: lastErr instanceof Error ? lastErr.message : "no photo found",
      });
      continue;
    }

    const newKey = pexelsPhotoKey(image.url) ?? String(image.photoId);
    used.add(newKey);
    used.add(String(image.photoId));

    await supabase
      .from("articles")
      .update({
        cover_image_url: image.url,
        cover_image_alt: image.alt || article.title,
        cover_image_credit: image.photographer,
        cover_image_credit_url: image.photographerUrl,
      })
      .eq("id", article.id);

    updates.push({
      id: article.id,
      slug: article.slug,
      reason: force
        ? "force-regenerated"
        : missing
          ? "filled-missing"
          : "replaced-duplicate",
    });
    revalidatePath(`/article/${article.slug}`);
  }

  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({
    ok: true,
    force,
    updated: updates.length,
    kept: skipped.length,
    failed: failed.length,
    updates,
    failedDetails: failed,
  });
}
