import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { SEO_LIMITS, clampToLimit } from "@/lib/seo";
import { SITE_NAME, UPLOAD_CATEGORIES, VERTICALS, slugify } from "@/lib/resources";

export const dynamic = "force-dynamic";

const SeoSchema = z.object({
  slug: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  keywords: z.string(),
  overview: z.string(),
  inside: z
    .array(z.object({ heading: z.string(), body: z.string() }))
    .max(4),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (auth.error) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error === "Forbidden" ? 403 : 401 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set, so Claude cannot draft SEO. Fill the fields manually." },
      { status: 400 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!title) return NextResponse.json({ error: "Add a title first" }, { status: 400 });

  const category =
    UPLOAD_CATEGORIES.find((item) => item.value === body.category)?.label ?? "White paper";
  const vertical =
    VERTICALS.find((item) => item.slug === body.verticalSlug)?.label ?? "finance";

  const client = new Anthropic();
  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2000,
      output_config: { format: zodOutputFormat(SeoSchema) },
      messages: [
        {
          role: "user",
          content: `Draft on-page SEO for a ${SITE_NAME} resource. Do not invent search volume, keyword difficulty, or rankings. Do not use em dashes.

Title: ${title}
Description: ${description || "(none yet)"}
Category: ${category}
Vertical: ${vertical}

Return:
- slug: lowercase hyphenated, based on the title
- metaTitle: max ${SEO_LIMITS.metaTitle} characters, include " | ${SITE_NAME}" if it fits
- metaDescription: max ${SEO_LIMITS.metaDescription} characters, one concrete reason a CFO would download this
- keywords: comma-separated, max ${SEO_LIMITS.keywords} characters, no volume numbers
- overview: 2 short sentences a reader sees on the page
- inside: 2 or 3 sections with a heading and one paragraph each, drawn only from the title and description`,
        },
      ],
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      return NextResponse.json({ error: "Claude did not return SEO fields" }, { status: 502 });
    }

    return NextResponse.json({
      slug: slugify(parsed.slug || title),
      metaTitle: clampToLimit(parsed.metaTitle, SEO_LIMITS.metaTitle),
      metaDescription: clampToLimit(parsed.metaDescription, SEO_LIMITS.metaDescription),
      keywords: clampToLimit(parsed.keywords, SEO_LIMITS.keywords),
      overview: parsed.overview.trim(),
      inside: parsed.inside
        .map((section) => ({
          heading: section.heading.trim(),
          body: section.body.trim(),
        }))
        .filter((section) => section.heading || section.body),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Claude request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
