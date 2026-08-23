"use client";

import { useState } from "react";
import type { Article, Topic } from "@/types/database";

interface SectionDraft {
  heading: string;
  paragraphsText: string;
}

interface PexelsResult {
  id: number;
  thumbUrl: string;
  fullUrl: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

function bodyToSectionDrafts(article?: Article | null): SectionDraft[] {
  if (!article?.body_json.sections?.length) {
    return [{ heading: "", paragraphsText: "" }];
  }
  return article.body_json.sections.map((s) => ({
    heading: s.heading,
    paragraphsText: s.paragraphs.join("\n\n"),
  }));
}

export default function ArticleForm({
  action,
  article,
  topics,
}: {
  action: (formData: FormData) => void;
  article?: Article | null;
  topics: Topic[];
}) {
  const [sections, setSections] = useState<SectionDraft[]>(
    bodyToSectionDrafts(article),
  );
  const [coverUrl, setCoverUrl] = useState(article?.cover_image_url ?? "");
  const [coverAlt, setCoverAlt] = useState(article?.cover_image_alt ?? "");
  const [coverCredit, setCoverCredit] = useState(
    article?.cover_image_credit ?? "",
  );
  const [coverCreditUrl, setCoverCreditUrl] = useState(
    article?.cover_image_credit_url ?? "",
  );
  const [pexelsQuery, setPexelsQuery] = useState("");
  const [pexelsResults, setPexelsResults] = useState<PexelsResult[]>([]);
  const [searching, setSearching] = useState(false);

  const sectionsJson = JSON.stringify(
    sections
      .filter((s) => s.heading.trim() || s.paragraphsText.trim())
      .map((s) => ({
        heading: s.heading,
        paragraphs: s.paragraphsText
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean),
      })),
  );

  async function searchPexels() {
    if (!pexelsQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/admin/pexels-search?q=${encodeURIComponent(pexelsQuery)}`,
      );
      const data = await res.json();
      setPexelsResults(data.photos ?? []);
    } finally {
      setSearching(false);
    }
  }

  function pickPhoto(p: PexelsResult) {
    setCoverUrl(p.fullUrl);
    setCoverAlt(p.alt);
    setCoverCredit(p.photographer);
    setCoverCreditUrl(p.photographerUrl);
  }

  return (
    <form action={action}>
      <input type="hidden" name="sections_json" value={sectionsJson} />
      {article?.body_json.chart && (
        <input
          type="hidden"
          name="chart_json"
          value={JSON.stringify(article.body_json.chart)}
        />
      )}
      <input type="hidden" name="cover_image_url" value={coverUrl} />
      <input type="hidden" name="cover_image_alt" value={coverAlt} />
      <input type="hidden" name="cover_image_credit" value={coverCredit} />
      <input
        type="hidden"
        name="cover_image_credit_url"
        value={coverCreditUrl}
      />

      <div className="admin-card">
        <h2>Basics</h2>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            defaultValue={article?.title}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="slug">Slug (leave blank to auto-generate)</label>
          <input id="slug" name="slug" defaultValue={article?.slug} />
        </div>
        <div className="field">
          <label htmlFor="dek">Dek (one-sentence summary)</label>
          <textarea id="dek" name="dek" defaultValue={article?.dek} required />
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="topic_id">Topic</label>
            <select
              id="topic_id"
              name="topic_id"
              defaultValue={article?.topic_id ?? ""}
            >
              <option value="">— None —</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              defaultValue={article?.status ?? "draft"}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="read_time_minutes">Read time (min)</label>
            <input
              id="read_time_minutes"
              name="read_time_minutes"
              type="number"
              min={1}
              max={30}
              defaultValue={article?.read_time_minutes ?? 5}
            />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2>Cover image (Pexels)</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Search Pexels, e.g. 'finance meeting'"
            value={pexelsQuery}
            onChange={(e) => setPexelsQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                searchPexels();
              }
            }}
            style={{
              flex: 1,
              padding: "11px 13px",
              border: "1px solid var(--line)",
              borderRadius: "var(--r)",
            }}
          />
          <button
            type="button"
            className="btn btn-out"
            onClick={searchPexels}
            disabled={searching}
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>

        {pexelsResults.length > 0 && (
          <div className="admin-pexels-grid">
            {pexelsResults.map((p) => (
              <button
                type="button"
                key={p.id}
                className={p.fullUrl === coverUrl ? "selected" : ""}
                onClick={() => pickPhoto(p)}
                title={`Photo by ${p.photographer}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbUrl} alt={p.alt} />
              </button>
            ))}
          </div>
        )}

        {coverUrl && (
          <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 10 }}>
            Selected — photo by {coverCredit || "unknown"}
          </p>
        )}

        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="cover_image_url_manual">
            Or paste an image URL directly
          </label>
          <input
            id="cover_image_url_manual"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://images.pexels.com/..."
          />
        </div>
      </div>

      <div className="admin-card">
        <h2>Body</h2>
        {article?.body_json.chart && (
          <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: -6, marginBottom: 16 }}>
            This article has an AI-generated chart (&ldquo;{article.body_json.chart.title}
            &rdquo;) that will be kept as-is — there&apos;s no chart editor here yet.
          </p>
        )}
        <div className="field">
          <label htmlFor="lede">Lede (opening paragraph)</label>
          <textarea
            id="lede"
            name="lede"
            defaultValue={article?.body_json.lede}
            required
          />
        </div>

        {sections.map((section, i) => (
          <div className="admin-section-block" key={i}>
            <div className="field">
              <label>Section {i + 1} heading</label>
              <input
                value={section.heading}
                onChange={(e) => {
                  const next = [...sections];
                  next[i] = { ...next[i], heading: e.target.value };
                  setSections(next);
                }}
              />
            </div>
            <div className="field">
              <label>Paragraphs (blank line between paragraphs)</label>
              <textarea
                rows={5}
                value={section.paragraphsText}
                onChange={(e) => {
                  const next = [...sections];
                  next[i] = { ...next[i], paragraphsText: e.target.value };
                  setSections(next);
                }}
              />
            </div>
            {sections.length > 1 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSections(sections.filter((_, j) => j !== i))}
              >
                Remove section
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className="btn btn-out"
          onClick={() =>
            setSections([...sections, { heading: "", paragraphsText: "" }])
          }
        >
          + Add section
        </button>

        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="pullQuote">Pull quote (optional)</label>
          <textarea
            id="pullQuote"
            name="pullQuote"
            defaultValue={article?.body_json.pullQuote}
          />
        </div>

        <div className="field">
          <label htmlFor="takeaways">
            Key takeaways (one per line, optional)
          </label>
          <textarea
            id="takeaways"
            name="takeaways"
            rows={4}
            defaultValue={article?.body_json.takeaways?.join("\n")}
          />
        </div>
      </div>

      <div className="admin-card">
        <h2>SEO</h2>
        <div className="field">
          <label htmlFor="meta_title">Meta title</label>
          <input
            id="meta_title"
            name="meta_title"
            defaultValue={article?.meta_title ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="meta_description">Meta description</label>
          <textarea
            id="meta_description"
            name="meta_description"
            defaultValue={article?.meta_description ?? ""}
          />
        </div>
      </div>

      <button type="submit" className="btn btn-solid">
        {article ? "Save changes" : "Create article"}
      </button>
    </form>
  );
}
