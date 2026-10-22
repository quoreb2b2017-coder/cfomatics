"use client";

import { useRef, useState } from "react";
import ConsentText from "@/components/resources/ConsentText";
import {
  DEFAULT_EMAIL_NOTE,
  DEFAULT_FIELDS,
  DEFAULT_FOOTER,
  DEFAULT_OPT_OUT,
  DEFAULT_PARTNERS,
  DEFAULT_TERMS,
  FORM_FIELD_OPTIONS,
  SITE_NAME,
  UPLOAD_CATEGORIES,
  VERTICALS,
  catalogField,
  categoryLabel,
} from "@/lib/resources";
import type {
  ResourceConsent,
  ResourceField,
  ResourceInsideSection,
  ResourceItem,
  ResourceQuestion,
} from "@/types/database";

type Draft = {
  id?: string;
  title: string;
  description: string;
  category: string;
  verticalSlug: string;
  slug: string;
  offeredBy: string;
  author: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  overview: string;
  inside: ResourceInsideSection[];
  fields: ResourceField[];
  fieldsExplicitlyEmpty: boolean;
  emailNote: string;
  footer: string;
  terms: ResourceConsent;
  partners: ResourceConsent;
  optOut: ResourceConsent;
  extras: ResourceConsent[];
  questions: ResourceQuestion[];
};

const emptyDraft = (): Draft => ({
  title: "",
  description: "",
  category: "whitepaper",
  verticalSlug: "",
  slug: "",
  offeredBy: SITE_NAME,
  author: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  overview: "",
  inside: [{ heading: "", body: "" }],
  fields: DEFAULT_FIELDS.map((field) => ({ ...field })),
  fieldsExplicitlyEmpty: false,
  emailNote: DEFAULT_EMAIL_NOTE,
  footer: DEFAULT_FOOTER,
  terms: { ...DEFAULT_TERMS },
  partners: { ...DEFAULT_PARTNERS },
  optOut: { ...DEFAULT_OPT_OUT },
  extras: [],
  questions: [],
});

function fromResource(item: ResourceItem): Draft {
  const config = item.form_config;
  return {
    id: item.id,
    title: item.title,
    description: item.description.slice(0, 220),
    category: item.category === "guide" ? "whitepaper" : item.category,
    verticalSlug: item.vertical_slug,
    slug: item.slug,
    offeredBy: item.offered_by || SITE_NAME,
    author: item.author_name || "",
    metaTitle: item.meta_title || "",
    metaDescription: item.meta_description || "",
    keywords: item.keywords || "",
    overview: item.overview || "",
    inside: item.inside_sections.length ? item.inside_sections : [{ heading: "", body: "" }],
    fields:
      config.fields && config.fields.length
        ? config.fields
        : config.fieldsExplicitlyEmpty
          ? []
          : DEFAULT_FIELDS.map((field) => ({ ...field })),
    fieldsExplicitlyEmpty: Boolean(config.fieldsExplicitlyEmpty && !config.fields?.length),
    emailNote: config.emailNote?.trim() || DEFAULT_EMAIL_NOTE,
    footer: config.footer?.trim() || DEFAULT_FOOTER,
    terms: config.terms ? { ...config.terms, role: "terms", required: true } : { ...DEFAULT_TERMS },
    partners: config.partners ? { ...config.partners, role: "partners", required: true } : { ...DEFAULT_PARTNERS },
    optOut: config.optOut ? { ...config.optOut, role: "optOut", required: false } : { ...DEFAULT_OPT_OUT },
    extras: (config.extras ?? []).slice(0, 8),
    questions: config.questions ?? [],
  };
}

export default function WhitePapersAdmin({ initial }: { initial: ResourceItem[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [seoMode, setSeoMode] = useState<"claude" | "manual">("manual");
  const [pdfName, setPdfName] = useState("");
  const [coverName, setCoverName] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [seoPending, setSeoPending] = useState(false);
  const [error, setError] = useState("");

  function patch(partial: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function openNew() {
    setDraft(emptyDraft());
    setSeoMode("manual");
    setPdf(null);
    setCover(null);
    setPdfName("");
    setCoverName("");
    setError("");
    setOpen(true);
  }

  function openEdit(item: ResourceItem) {
    setDraft(fromResource(item));
    setSeoMode(item.meta_title || item.keywords ? "manual" : "manual");
    setPdf(null);
    setCover(null);
    setPdfName(item.pdf_url ? "Current PDF kept unless you replace it" : "");
    setCoverName(item.cover_url ? "Current thumbnail kept unless you replace it" : "");
    setError("");
    setOpen(true);
  }

  function addSection() {
    const used = new Set(draft.fields.map((field) => field.key));
    const next = FORM_FIELD_OPTIONS.find((option) => !used.has(option.key));
    if (!next || draft.fields.length >= 12) return;
    patch({
      fields: [...draft.fields, { label: next.label, key: next.key, type: next.type, required: true }],
      fieldsExplicitlyEmpty: false,
    });
  }

  async function generateWithClaude() {
    if (!draft.title.trim()) {
      setError("Add a title before generating SEO");
      return;
    }
    setError("");
    setSeoPending(true);
    try {
      const res = await fetch("/api/admin/resources/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          category: draft.category,
          verticalSlug: draft.verticalSlug,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        slug?: string;
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string;
        overview?: string;
        inside?: { heading: string; body: string }[];
      };
      if (!res.ok) throw new Error(data.error || "Could not generate SEO");
      patch({
        slug: data.slug || draft.slug,
        metaTitle: data.metaTitle || "",
        metaDescription: data.metaDescription || "",
        keywords: data.keywords || "",
        overview: data.overview || draft.overview,
        inside: data.inside?.length ? data.inside : draft.inside,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate SEO");
    } finally {
      setSeoPending(false);
    }
  }

  async function onSave() {
    setError("");
    if (!draft.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!draft.description.trim()) {
      setError("Description is required");
      return;
    }
    if (draft.description.trim().length > 220) {
      setError("Description must be 220 characters or fewer");
      return;
    }
    if (!draft.verticalSlug) {
      setError("Choose a vertical");
      return;
    }
    if (!draft.id && !pdf) {
      setError("PDF file is required");
      return;
    }
    if ((!draft.id && !cover) || (draft.id && !cover && !coverName)) {
      setError("Thumbnail is required");
      return;
    }
    setPending(true);
    try {
      const body = new FormData();
      body.set(
        "payload",
        JSON.stringify({
          ...draft,
          description: draft.description.trim().slice(0, 220),
          fields: draft.fields.filter((field) => catalogField(field.key)),
          fieldsExplicitlyEmpty: draft.fields.length === 0,
          extras: draft.extras.filter((item) => item.text.trim()).slice(0, 8),
          questions: draft.questions
            .filter((question) => question.text.trim())
            .map((question) => ({
              text: question.text,
              options: question.options.map((option) => option.trim()).filter(Boolean),
            })),
          inside: draft.inside.filter((section) => section.heading.trim() || section.body.trim()),
        }),
      );
      if (pdf) body.set("pdf", pdf);
      if (cover) body.set("cover", cover);
      const res = await fetch("/api/admin/resources", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setPending(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this resource, its PDF, and its download rows?")) return;
    const res = await fetch(`/api/admin/resources?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      window.alert(data.error || "Could not delete");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }

  const usedKeys = new Set(draft.fields.map((field) => field.key));

  return (
    <>
      <div className="admin-pagehead-action" style={{ marginBottom: 16 }}>
        <button type="button" className="btn btn-solid" onClick={openNew}>
          Upload
        </button>
      </div>
      <div className="admin-card admin-card--flush">
        <div className="admin-table-scroll">
          <table className="admin-table admin-table--wrap">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Vertical</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4}>No uploads yet.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{categoryLabel(item.category)}</td>
                    <td>{item.vertical}</td>
                    <td>
                      <button type="button" className="admin-text-btn" onClick={() => openEdit(item)}>
                        Edit
                      </button>
                      <button type="button" className="admin-text-btn" onClick={() => onDelete(item.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="wp-drawer" role="dialog" aria-modal="true" aria-label="Resource upload">
          <button type="button" className="wp-drawer-backdrop" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="wp-drawer-panel">
            <header className="wp-drawer-head">
              <h2>{draft.id ? "Edit" : "Upload"}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </header>
            <div className="wp-drawer-body">
              <section className="wp-form-card">
                <h3>Download form</h3>
                <p className="admin-td-sub">
                  These fields and checkboxes are what visitors see. Add a section or checkbox, then save.
                </p>

                <h4>Download form sections</h4>
                <div className="wp-fields">
                  {draft.fields.map((field, index) => (
                    <div key={`${field.key}-${index}`} className="wp-field-row">
                      <select
                        aria-label="Field"
                        value={field.key}
                        onChange={(event) => {
                          const option = catalogField(event.target.value);
                          if (!option) return;
                          const fields = [...draft.fields];
                          fields[index] = { ...option, required: field.required };
                          patch({ fields, fieldsExplicitlyEmpty: false });
                        }}
                      >
                        {FORM_FIELD_OPTIONS.map((option) => (
                          <option
                            key={option.key}
                            value={option.key}
                            disabled={usedKeys.has(option.key) && option.key !== field.key}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <label className="wp-check">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) => {
                            const fields = [...draft.fields];
                            fields[index] = { ...field, required: event.target.checked };
                            patch({ fields });
                          }}
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        className="wp-ghost"
                        onClick={() => {
                          const fields = draft.fields.filter((_, i) => i !== index);
                          patch({ fields, fieldsExplicitlyEmpty: fields.length === 0 });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="wp-ghost"
                    disabled={draft.fields.length >= 12 || usedKeys.size >= FORM_FIELD_OPTIONS.length}
                    onClick={addSection}
                  >
                    Add section
                  </button>
                </div>

                <h4>Download form consent text</h4>
                <p className="admin-td-sub">
                  Use the green chips under a box to drop a link into the sentence. **text** is bold.
                </p>
                <label className="wp-label">
                  Email note
                  <textarea
                    rows={2}
                    value={draft.emailNote}
                    onChange={(event) => patch({ emailNote: event.target.value })}
                  />
                </label>
                <ConsentEditor
                  label="Terms checkbox"
                  consent={draft.terms}
                  showVisible
                  lockRequired
                  onChange={(terms) => patch({ terms: { ...terms, role: "terms", required: true } })}
                />
                <ConsentEditor
                  label="Partners checkbox"
                  consent={draft.partners}
                  showVisible
                  lockRequired
                  onChange={(partners) => patch({ partners: { ...partners, role: "partners", required: true } })}
                />
                <ConsentEditor
                  label="Opt-out checkbox"
                  hint="Optional. Visitors can leave this unchecked and still download. Checking it stops further emails."
                  consent={draft.optOut}
                  showVisible
                  optional
                  onChange={(optOut) => patch({ optOut: { ...optOut, role: "optOut", required: false } })}
                />
                <label className="wp-label">
                  Line under Download Now
                  <textarea
                    rows={2}
                    value={draft.footer}
                    onChange={(event) => patch({ footer: event.target.value })}
                  />
                </label>
                <p className="wp-consent-preview">
                  <ConsentText text={draft.footer || DEFAULT_FOOTER} />
                </p>
                {draft.extras.map((extra, index) => (
                  <ConsentEditor
                    key={`extra-${index}`}
                    label={`Extra checkbox ${index + 1}`}
                    consent={extra}
                    onChange={(next) => {
                      const extras = [...draft.extras];
                      extras[index] = { ...next, role: "extra", visible: true };
                      patch({ extras });
                    }}
                    onRemove={() => patch({ extras: draft.extras.filter((_, i) => i !== index) })}
                  />
                ))}
                <button
                  type="button"
                  className="wp-ghost"
                  disabled={draft.extras.length >= 8}
                  onClick={() =>
                    patch({
                      extras: [...draft.extras, { text: "", required: false, visible: true, role: "extra" }],
                    })
                  }
                >
                  Add checkbox
                </button>

                <h4>Download form questions</h4>
                <p className="admin-td-sub">Every question is required on the public form.</p>
                {draft.questions.map((question, index) => (
                  <div key={index} className="wp-question">
                    <input
                      value={question.text}
                      placeholder="Question"
                      onChange={(event) => {
                        const questions = [...draft.questions];
                        questions[index] = { ...question, text: event.target.value };
                        patch({ questions });
                      }}
                    />
                    <textarea
                      value={question.options.join("\n")}
                      placeholder="One answer option per line. Two or more become a dropdown."
                      onChange={(event) => {
                        const questions = [...draft.questions];
                        questions[index] = { ...question, options: event.target.value.split("\n") };
                        patch({ questions });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => patch({ questions: draft.questions.filter((_, i) => i !== index) })}
                    >
                      Remove question
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="wp-ghost"
                  onClick={() => patch({ questions: [...draft.questions, { text: "", options: [] }] })}
                >
                  Add question
                </button>
              </section>

              <section className="wp-block">
                <div className="wp-split">
                <label className="wp-label">
                  Category
                  <select value={draft.category} onChange={(event) => patch({ category: event.target.value })} required>
                    {UPLOAD_CATEGORIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <VerticalField
                  key={`${draft.id ?? "new"}-${draft.verticalSlug}`}
                  value={draft.verticalSlug}
                  onChange={(verticalSlug) => patch({ verticalSlug })}
                />
                </div>
                <div className="wp-split">
                <label className="wp-label">
                  PDF
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    required={!draft.id}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setPdf(file);
                      setPdfName(file?.name ?? "");
                    }}
                  />
                  {pdfName ? <span className="admin-td-sub">{pdfName}</span> : null}
                </label>
                <label className="wp-label">
                  Thumbnail
                  <input
                    type="file"
                    accept="image/*"
                    required={!draft.id && !coverName}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setCover(file);
                      setCoverName(file?.name ?? "");
                    }}
                  />
                  {coverName ? <span className="admin-td-sub">{coverName}</span> : null}
                </label>
                </div>

                <fieldset className="wp-seo-mode">
                  <legend>SEO mode</legend>
                  <label>
                    <input
                      type="radio"
                      name="seo-mode"
                      checked={seoMode === "claude"}
                      onChange={() => setSeoMode("claude")}
                    />
                    Claude
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="seo-mode"
                      checked={seoMode === "manual"}
                      onChange={() => setSeoMode("manual")}
                    />
                    Manual
                  </label>
                </fieldset>

                <label className="wp-label">
                  Title
                  <input value={draft.title} onChange={(event) => patch({ title: event.target.value })} required />
                </label>
                <label className="wp-label">
                  Description
                  <textarea
                    maxLength={220}
                    value={draft.description}
                    onChange={(event) => patch({ description: event.target.value.slice(0, 220) })}
                    required
                  />
                  <span className="admin-td-sub">{draft.description.length}/220</span>
                </label>
                <div className="wp-split">
                <label className="wp-label">
                  Offered by
                  <input value={draft.offeredBy} onChange={(event) => patch({ offeredBy: event.target.value })} />
                </label>
                <label className="wp-label">
                  Author
                  <input value={draft.author} onChange={(event) => patch({ author: event.target.value })} />
                </label>
                </div>

                <div className="wp-seo-head">
                  <h4>{seoMode === "claude" ? "Claude SEO" : "Manual SEO"}</h4>
                  {seoMode === "claude" ? (
                    <button type="button" className="btn btn-solid" disabled={seoPending} onClick={generateWithClaude}>
                      {seoPending ? "Generating…" : "Generate with Claude"}
                    </button>
                  ) : null}
                </div>
                <p className="admin-td-sub">
                  {seoMode === "claude"
                    ? "Generate a draft, then edit any field before you save. Nothing publishes until you save."
                    : "Type the SEO yourself. Nothing publishes until you save."}
                </p>
                <label className="wp-label">
                  Slug
                  <input value={draft.slug} onChange={(event) => patch({ slug: event.target.value })} />
                </label>
                <label className="wp-label">
                  Meta title
                  <input value={draft.metaTitle} onChange={(event) => patch({ metaTitle: event.target.value })} />
                </label>
                <label className="wp-label">
                  Meta description
                  <textarea
                    value={draft.metaDescription}
                    onChange={(event) => patch({ metaDescription: event.target.value })}
                  />
                </label>
                <label className="wp-label">
                  Keywords
                  <input value={draft.keywords} onChange={(event) => patch({ keywords: event.target.value })} />
                </label>
                <label className="wp-label">
                  Overview
                  <textarea value={draft.overview} onChange={(event) => patch({ overview: event.target.value })} />
                </label>
                <h4>Inside sections</h4>
                {draft.inside.map((section, index) => (
                  <div key={index} className="wp-question">
                    <input
                      value={section.heading}
                      placeholder="Heading"
                      onChange={(event) => {
                        const inside = [...draft.inside];
                        inside[index] = { ...section, heading: event.target.value };
                        patch({ inside });
                      }}
                    />
                    <textarea
                      value={section.body}
                      placeholder="Section copy"
                      onChange={(event) => {
                        const inside = [...draft.inside];
                        inside[index] = { ...section, body: event.target.value };
                        patch({ inside });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="wp-ghost"
                  onClick={() => patch({ inside: [...draft.inside, { heading: "", body: "" }] })}
                >
                  Add inside section
                </button>
              </section>
              {error ? <p className="res-download-error">{error}</p> : null}
            </div>
            <footer className="wp-drawer-foot">
              <button type="button" className="wp-ghost" disabled={pending} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className="wp-save" disabled={pending} onClick={onSave}>
                {pending ? "Saving…" : "Save"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

function ConsentEditor({
  label,
  hint,
  consent,
  onChange,
  onRemove,
  showVisible = false,
  lockRequired = false,
  optional = false,
}: {
  label: string;
  hint?: string;
  consent: ResourceConsent;
  onChange: (next: ResourceConsent) => void;
  onRemove?: () => void;
  showVisible?: boolean;
  lockRequired?: boolean;
  optional?: boolean;
}) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  function insertToken(token: string) {
    const field = fieldRef.current;
    const value = consent.text;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${token}${value.slice(end)}`;
    onChange({ ...consent, text: next });
    requestAnimationFrame(() => {
      field?.focus();
      const caret = start + token.length;
      field?.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="wp-consent">
      <div className="wp-consent-title">
        <span>{label}</span>
        {optional ? <span className="wp-optional">Optional</span> : null}
      </div>
      {hint ? <p className="admin-td-sub">{hint}</p> : null}
      <label className="wp-label">
        Text
        <textarea
          ref={fieldRef}
          rows={3}
          value={consent.text}
          placeholder="I agree to the {{privacy}}. Or write {link text|/privacy}."
          onChange={(event) => onChange({ ...consent, text: event.target.value })}
        />
      </label>
      <div className="wp-token-row">
        <button type="button" onClick={() => insertToken("{{terms}}")}>{"{terms}"}</button>
        <button type="button" onClick={() => insertToken("{{privacy}}")}>{"{privacy}"}</button>
        <button type="button" onClick={() => insertToken("{{privacy-statement}}")}>{"{privacy-statement}"}</button>
        <button type="button" onClick={() => insertToken("{{unsubscribe}}")}>{"{unsubscribe}"}</button>
        <button type="button" onClick={() => insertToken("{{publisher}}")}>{"{publisher}"}</button>
        <button type="button" onClick={() => insertToken("{link text|/path}")}>{"{text|/path}"}</button>
      </div>
      <p className="wp-consent-preview">
        {consent.text.trim() ? <ConsentText text={consent.text} /> : "Preview appears here."}
      </p>
      <div className="wp-consent-flags">
        {lockRequired || optional ? null : (
          <label>
            <input
              type="checkbox"
              checked={consent.required}
              onChange={(event) => onChange({ ...consent, required: event.target.checked })}
            />
            Required
          </label>
        )}
        {showVisible ? (
          <label>
            <input
              type="checkbox"
              checked={consent.visible}
              onChange={(event) => onChange({ ...consent, visible: event.target.checked })}
            />
            Show
          </label>
        ) : null}
        {onRemove ? (
          <button type="button" onClick={onRemove}>
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

function VerticalField({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  const selected = VERTICALS.find((item) => item.slug === value);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [openList, setOpenList] = useState(false);
  const matches = VERTICALS.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <label className="wp-label wp-vertical">
      Vertical
      <input
        value={query}
        placeholder="Search verticals"
        role="combobox"
        aria-expanded={openList}
        onFocus={() => setOpenList(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpenList(true);
          onChange("");
        }}
      />
      {openList ? (
        <ul className="wp-vertical-list">
          {matches.map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => {
                  onChange(item.slug);
                  setQuery(item.label);
                  setOpenList(false);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
          {matches.length === 0 ? <li className="admin-td-sub">No matching vertical</li> : null}
        </ul>
      ) : null}
    </label>
  );
}
