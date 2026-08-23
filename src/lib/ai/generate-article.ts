import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { normalizeDashesDeep } from "@/lib/text";

const MODEL = "claude-opus-5";

const client = new Anthropic();

const ArticleSchema = z.object({
  slug: z
    .string()
    .describe(
      "SEO URL slug: lowercase, hyphen-separated, keyword-rich, 4-8 words, no stop words at start",
    ),
  title: z
    .string()
    .describe(
      "Page H1 / headline. Sentence case, specific, primary keyword near the front, 55-75 characters ideal, no clickbait",
    ),
  dek: z
    .string()
    .describe(
      "One-sentence subhead under the H1, 20-35 words, expands the title for readers and SEO",
    ),
  topic_slug: z
    .string()
    .describe(
      "Which navbar category this belongs to — must be one of the provided topic slugs",
    ),
  focus_keyword: z
    .string()
    .describe(
      "Primary SEO phrase (2-5 words) drawn from the trending angle, e.g. 'CFO succession planning'",
    ),
  meta_title: z
    .string()
    .describe(
      "Browser/SEO <title>. Include focus keyword near the start. End with ' | CFOmatics'. Total under 60 characters.",
    ),
  meta_description: z
    .string()
    .describe(
      "SEO meta description AND Open Graph description. 145-160 characters. Include focus keyword once, a concrete hook, and a reason for CFOs to click. No quotes.",
    ),
  og_title: z
    .string()
    .describe(
      "Open Graph / social share title. Can match meta_title without the brand suffix, or be a tighter social variant. Under 70 characters.",
    ),
  read_time_minutes: z.number().int().min(2).max(12),
  image_search_query: z
    .string()
    .describe(
      "3-6 word English Pexels search query SPECIFIC to this article subject — avoid generic 'finance' or 'office' alone.",
    ),
  body: z.object({
    lede: z
      .string()
      .describe(
        "Opening paragraph (no heading above it). 2-4 sentences. Naturally include the focus keyword once in the first 100 words.",
      ),
    sections: z
      .array(
        z.object({
          heading: z
            .string()
            .describe(
              "H2 section heading — descriptive, keyword-aware when natural, never generic 'Introduction'/'Conclusion'",
            ),
          paragraphs: z
            .array(z.string())
            .min(1)
            .describe("1-3 paragraphs of body prose for this section"),
        }),
      )
      .min(2)
      .max(5),
    pullQuote: z
      .string()
      .optional()
      .describe("One striking sentence pulled from or inspired by the body"),
    takeaways: z
      .array(z.string())
      .min(3)
      .max(5)
      .optional()
      .describe("Short bullet takeaways for a 'Key takeaways' box"),
    chart: z
      .object({
        title: z.string().describe("Short chart title"),
        type: z
          .enum(["bar", "line"])
          .describe("'line' only for a time trend (3+ points); 'bar' otherwise"),
        unit: z.string().optional(),
        labels: z.array(z.string()).min(3).max(8),
        series: z
          .array(
            z.object({
              name: z.string(),
              values: z.array(z.number()),
            }),
          )
          .min(1)
          .max(2),
        sourceNote: z.string().optional(),
      })
      .optional()
      .describe(
        "ONLY if research has real numeric data. Never invent numbers. Omit if unsure.",
      ),
  }),
});

export type GeneratedArticle = z.infer<typeof ArticleSchema>;

export type NavbarTopic = { id: string; slug: string; name: string };

/**
 * Step 1: Web-search trending coverage across major finance/news sites for
 * ONE navbar topic (CFOmatics category), then return a research brief.
 */
export async function researchTopic(
  recentTitles: string[],
  topic: NavbarTopic,
  allNavbarTopics: NavbarTopic[],
): Promise<string> {
  const avoidList =
    recentTitles.length > 0
      ? `Do NOT repeat or closely rehash any of these already-published CFOmatics titles:\n${recentTitles.map((t) => `- ${t}`).join("\n")}`
      : "No prior CFOmatics articles yet.";

  const navbarList = allNavbarTopics
    .map((t) => `- ${t.name} (slug: ${t.slug})`)
    .join("\n");

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `You are the research desk for CFOmatics, a CFO/finance editorial site.

NAVBAR TOPICS (site categories — you MUST stay inside the assigned one):
${navbarList}

ASSIGNED NAVBAR TOPIC FOR THIS RUN:
- Name: ${topic.name}
- Slug: ${topic.slug}

YOUR JOB:
1. Use web search to scan DIFFERENT reputable sites for what is trending / newly reported RIGHT NOW in "${topic.name}" for CFOs and finance leaders.
2. Search across multiple outlets — e.g. Reuters, Bloomberg, WSJ / CFO Journal, Financial Times, CFO Dive, Accounting Today, Harvard Business Review, Deloitte/PwC/KPMG insights, SEC/FASB/IRS releases, Federal Reserve, major bank research — not just one domain.
3. Prefer angles that appeared in the last 7-14 days (or are clearly escalating now).
4. Pick ONE concrete, newsworthy story angle that CFOmatics can cover uniquely for the office of the CFO.
5. The angle MUST clearly belong under "${topic.name}" — not a different navbar topic.

Suggested search patterns (run several):
- "${topic.name} CFO news"
- "trending ${topic.name} finance"
- "${topic.name} CFOs 2026" (or current year)
- site-specific or outlet + "${topic.name}" queries

${avoidList}

OUTPUT a plain-text research brief (no JSON) with these labeled sections:
TRENDING ANGLE: one clear headline-ready angle
WHY NOW: what makes it timely (cite outlets/dates you found)
PRIMARY KEYWORD: 2-5 word SEO focus phrase
FACTS: 4-6 concrete facts or data points with source names
CFO IMPLICATION: why finance leaders care
SOURCES: outlet names worth referencing

If you find a genuine, citable numeric series (3+ comparable points), add:
CHARTABLE DATA: labeled values + source
Otherwise omit that section — never invent numbers.

Keep the brief under 550 words.`,
    },
  ];

  let finalText = "";

  for (let i = 0; i < 6; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
      messages,
    });

    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }

    finalText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    break;
  }

  if (!finalText) {
    throw new Error(
      "Web research did not produce a final answer (too many pause_turn cycles)",
    );
  }

  return finalText;
}

/**
 * Step 2: Turn the trending research brief into a structured, SEO-ready article.
 * title = on-page H1; meta_* / og_* feed Next.js Metadata + Open Graph tags.
 */
export async function writeArticleFromBrief(
  researchBrief: string,
  topicSlugs: string[],
  forcedTopicSlug: string,
): Promise<GeneratedArticle> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    output_config: { format: zodOutputFormat(ArticleSchema) },
    messages: [
      {
        role: "user",
        content: `Using the research brief below, write a full article for CFOmatics (publication for CFOs and finance leaders). Tone: clear, editorial, non-hype — like WSJ CFO Journal. Concrete and specific.

HOUSE STYLE: Never use em dashes (—) or en dashes (–). Use a plain hyphen with spaces when needed, or rewrite as two sentences. Applies to title, dek, body, quotes, takeaways, meta fields.

TOPIC (required): Set topic_slug to exactly "${forcedTopicSlug}". Valid slugs for reference: ${topicSlugs.join(", ")}.

SEO RULES (required):
1. title is the on-page H1 — unique, specific, focus keyword near the front.
2. meta_title under 60 chars, focus keyword early, ends with " | CFOmatics".
3. meta_description 145-160 chars — hook + keyword + CFO benefit (also used as OG description).
4. og_title is the social/Open Graph title (no need for brand suffix).
5. focus_keyword matches the brief's PRIMARY KEYWORD (or a tight refinement).
6. slug is hyphenated and keyword-aligned with the title.
7. First body lede includes the focus keyword once, naturally.
8. Section headings are real H2s (descriptive), not "Introduction"/"Conclusion".
9. Do not keyword-stuff; stay readable.

CHART: Only fill "chart" if the brief has real CHARTABLE DATA or an explicit sourced numeric series. Never fabricate numbers. When in doubt, omit chart.

Research brief:
"""
${researchBrief}
"""`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Structured article output failed to parse");
  }

  const article = {
    ...response.parsed_output,
    topic_slug: forcedTopicSlug,
  };

  const chart = article.body.chart;
  if (
    chart &&
    chart.series.some((s) => s.values.length !== chart.labels.length)
  ) {
    return normalizeDashesDeep({
      ...article,
      body: { ...article.body, chart: undefined },
    });
  }

  return normalizeDashesDeep(article);
}
