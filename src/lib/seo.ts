import type { Article, ArticleBody } from "@/types/database";

export const SEO_LIMITS = {
  h1: 70,
  metaTitle: 60,
  metaDescription: 160,
  ogTitle: 70,
  aeoAnswer: 320,
  geoSummary: 400,
  focusKeyword: 50,
  keywords: 180,
} as const;

export const META_TITLE_BRAND = " | CFOmatics";

export function parseKeywordList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

/** Trim to max length at a word/phrase boundary. Shorter input is unchanged. */
export function clampToLimit(input: string, max: number): string {
  const value = input.replace(/\s+/g, " ").trim();
  if (!value || value.length <= max) return value;

  const slice = value.slice(0, max);
  const breakAt = Math.max(
    slice.lastIndexOf(" "),
    slice.lastIndexOf(","),
    slice.lastIndexOf(";"),
    slice.lastIndexOf("-"),
  );
  const minBreak = Math.min(12, Math.floor(max * 0.55));
  const cut = breakAt >= minBreak ? slice.slice(0, breakAt) : slice;
  return cut.replace(/[\s,.;:!?/-]+$/g, "").trim();
}

export function clampMetaTitle(input: string): string {
  const max = SEO_LIMITS.metaTitle;
  let value = input.replace(/\s+/g, " ").trim();
  if (!value) return value;

  if (/\|\s*CFOmatics\s*$/i.test(value)) {
    const core = value.replace(/\s*\|\s*CFOmatics\s*$/i, "").trim();
    const coreMax = Math.max(8, max - META_TITLE_BRAND.length);
    return `${clampToLimit(core, coreMax)}${META_TITLE_BRAND}`;
  }

  return clampToLimit(value, max);
}

export function clampKeywordList(raw: string, max = SEO_LIMITS.keywords): string {
  const parts = parseKeywordList(raw);
  if (parts.length === 0) return "";

  const kept: string[] = [];
  for (const part of parts) {
    const phrase = clampToLimit(part, max);
    if (!phrase) continue;
    const next = kept.length ? `${kept.join(", ")}, ${phrase}` : phrase;
    if (next.length > max) break;
    kept.push(phrase);
  }

  if (kept.length === 0) {
    return clampToLimit(parts[0], max);
  }
  return kept.join(", ");
}

function deriveFocusKeyword(title: string): string {
  const cleaned = title
    .replace(/[:.!?].*$/, "")
    .replace(/[^a-zA-Z0-9\s&-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter(Boolean).slice(0, 5);
  return clampToLimit(words.join(" "), SEO_LIMITS.focusKeyword);
}

export type HydratedSeo = {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  focusKeyword: string;
  keywords: string;
  aeoAnswer: string;
  geoSummary: string;
};

function clampHydrated(seo: HydratedSeo): HydratedSeo {
  return {
    metaTitle: clampMetaTitle(seo.metaTitle),
    metaDescription: clampToLimit(seo.metaDescription, SEO_LIMITS.metaDescription),
    ogTitle: clampToLimit(seo.ogTitle, SEO_LIMITS.ogTitle),
    focusKeyword: clampToLimit(seo.focusKeyword, SEO_LIMITS.focusKeyword),
    keywords: clampKeywordList(seo.keywords),
    aeoAnswer: clampToLimit(seo.aeoAnswer, SEO_LIMITS.aeoAnswer),
    geoSummary: clampToLimit(seo.geoSummary, SEO_LIMITS.geoSummary),
  };
}

/** Fill SEO fields for admin display. Older AI posts stored meta columns
 *  but not keywords / OG / AEO / GEO - those are derived so they still show. */
export function hydrateArticleSeo(
  article: Pick<Article, "title" | "dek" | "meta_title" | "meta_description"> & {
    body_json?: Article["body_json"] | null;
  },
  topicName?: string | null,
): HydratedSeo {
  const seo = article.body_json?.seo ?? {};
  const focusKeyword =
    seo.focus_keyword?.trim() || deriveFocusKeyword(article.title);
  const keywords =
    seo.keywords?.trim() ||
    [topicName, focusKeyword].filter(Boolean).join(", ");

  return clampHydrated({
    metaTitle: (article.meta_title || article.title || "").trim(),
    metaDescription: (article.meta_description || article.dek || "").trim(),
    ogTitle: (seo.og_title || article.title || "").trim(),
    focusKeyword,
    keywords,
    aeoAnswer: (seo.aeo_answer || article.dek || "").trim(),
    geoSummary: (
      seo.geo_summary ||
      article.body_json?.lede ||
      article.dek ||
      ""
    ).trim(),
  });
}

export type GeneratedSeoFields = {
  title: string;
  meta_title: string;
  meta_description: string;
  og_title: string;
  focus_keyword: string;
  seo_keywords: string;
  aeo_answer: string;
  geo_summary: string;
};

/** Hard cap for AI output. Never exceeds standard SEO lengths. */
export function clampGeneratedSeoFields<T extends GeneratedSeoFields>(article: T): T {
  return {
    ...article,
    title: clampToLimit(article.title, SEO_LIMITS.h1),
    meta_title: clampMetaTitle(article.meta_title),
    meta_description: clampToLimit(
      article.meta_description,
      SEO_LIMITS.metaDescription,
    ),
    og_title: clampToLimit(article.og_title, SEO_LIMITS.ogTitle),
    focus_keyword: clampToLimit(article.focus_keyword, SEO_LIMITS.focusKeyword),
    seo_keywords: clampKeywordList(article.seo_keywords),
    aeo_answer: clampToLimit(article.aeo_answer, SEO_LIMITS.aeoAnswer),
    geo_summary: clampToLimit(article.geo_summary, SEO_LIMITS.geoSummary),
  };
}

export function applySeoLimitsToArticle(
  article: Pick<Article, "title" | "dek" | "meta_title" | "meta_description"> & {
    body_json: ArticleBody;
  },
  topicName?: string | null,
): {
  title: string;
  meta_title: string;
  meta_description: string;
  body_json: ArticleBody;
} {
  const title = clampToLimit(article.title, SEO_LIMITS.h1);
  const hydrated = hydrateArticleSeo({ ...article, title }, topicName);

  return {
    title,
    meta_title: hydrated.metaTitle,
    meta_description: hydrated.metaDescription,
    body_json: {
      ...article.body_json,
      seo: {
        ...article.body_json.seo,
        focus_keyword: hydrated.focusKeyword,
        og_title: hydrated.ogTitle,
        keywords: hydrated.keywords,
        aeo_answer: hydrated.aeoAnswer,
        geo_summary: hydrated.geoSummary,
      },
    },
  };
}

export function articleSeoChanged(
  before: {
    title: string;
    meta_title: string | null;
    meta_description: string | null;
    body_json: ArticleBody;
  },
  after: ReturnType<typeof applySeoLimitsToArticle>,
): boolean {
  return (
    before.title !== after.title ||
    (before.meta_title ?? "") !== after.meta_title ||
    (before.meta_description ?? "") !== after.meta_description ||
    JSON.stringify(before.body_json.seo ?? {}) !==
      JSON.stringify(after.body_json.seo ?? {})
  );
}
