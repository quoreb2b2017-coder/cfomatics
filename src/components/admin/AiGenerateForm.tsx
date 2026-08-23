"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Topic } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { SEO_LIMITS, clampToLimit } from "@/lib/seo";

type LogLine = { kind: "info" | "ok" | "err"; text: string };

const MAX_TITLES = 5;

export default function AiGenerateForm({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [titlesText, setTitlesText] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);

  function titles(): string[] {
    return titlesText
      .split(/\n/)
      .map((t) => clampToLimit(t.trim(), SEO_LIMITS.h1))
      .filter(Boolean);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const list = titles();
    if (!topicId) {
      setLog([{ kind: "err", text: "Select a topic first." }]);
      return;
    }
    if (list.length === 0) {
      setLog([{ kind: "err", text: "Enter at least one title." }]);
      return;
    }
    if (list.length > MAX_TITLES) {
      setLog([
        {
          kind: "err",
          text: `Max ${MAX_TITLES} titles at a time. Remove ${list.length - MAX_TITLES}.`,
        },
      ]);
      return;
    }

    setRunning(true);
    const created: { id: string; title: string }[] = [];
    const nextLog: LogLine[] = [
      {
        kind: "info",
        text: `Generating ${list.length} article${list.length === 1 ? "" : "s"}. Each takes about 1-2 minutes (research, body, cover, SEO).`,
      },
    ];
    setLog(nextLog);

    for (let i = 0; i < list.length; i++) {
      const title = list[i];
      nextLog.push({
        kind: "info",
        text: `${i + 1}/${list.length} Researching and writing: ${title}`,
      });
      setLog([...nextLog]);

      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          nextLog.push({
            kind: "err",
            text: "Session expired. Refresh the page and sign in again.",
          });
          setLog([...nextLog]);
          setRunning(false);
          return;
        }

        const res = await fetch("/api/admin/generate-article", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            topic_id: topicId,
            title,
            status,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          id?: string;
          title?: string;
          error?: string;
        };
        if (!res.ok || !data.ok || !data.id) {
          nextLog.push({
            kind: "err",
            text: `Failed: ${
              res.status === 401
                ? "Unauthorized - refresh the page and sign in again."
                : (data.error ?? res.statusText)
            }`,
          });
          setLog([...nextLog]);
          setRunning(false);
          return;
        }
        created.push({ id: data.id, title: data.title ?? title });
        nextLog.push({
          kind: "ok",
          text: `Saved: ${data.title ?? title}`,
        });
        setLog([...nextLog]);
      } catch (err) {
        nextLog.push({
          kind: "err",
          text: err instanceof Error ? err.message : "Request failed",
        });
        setLog([...nextLog]);
        setRunning(false);
        return;
      }
    }

    setRunning(false);
    if (created.length === 1) {
      router.push(`/admin/articles/${created[0].id}/edit`);
      router.refresh();
      return;
    }
    router.push("/admin/articles");
    router.refresh();
  }

  return (
    <form id="generate" className="admin-card admin-gen" onSubmit={onSubmit}>
      <div className="admin-card-head">
        <h2>Generate with AI</h2>
      </div>
      <p className="field-hint" style={{ marginTop: -8, marginBottom: 16 }}>
        Select a topic, paste title(s), and we will research the web, write
        the full article, pick a unique Pexels cover, and fill SEO (H1, meta,
        Open Graph, keywords, AEO, GEO).
      </p>

      <div className="admin-form-row">
        <div className="field">
          <label htmlFor="gen_topic_id">Topic</label>
          <select
            id="gen_topic_id"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            required
            disabled={running}
          >
            {topics.length === 0 && <option value="">No topics yet</option>}
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="gen_status">After generate</label>
          <select
            id="gen_status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value === "draft" ? "draft" : "published")
            }
            disabled={running}
          >
            <option value="published">Publish live</option>
            <option value="draft">Save as draft</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="gen_titles">Titles (one per line)</label>
        <textarea
          id="gen_titles"
          rows={5}
          value={titlesText}
          onChange={(e) => setTitlesText(e.target.value)}
          placeholder={"CFO succession planning after a sudden departure\nHow tariff refunds change Q3 cash forecasts"}
          required
          disabled={running}
        />
        <span className="field-hint">
          Up to {MAX_TITLES} headlines. Each H1 max {SEO_LIMITS.h1}{" "}
          characters (shorter is fine). Your wording is kept as the title.
        </span>
      </div>

      <button type="submit" className="btn btn-solid" disabled={running}>
        {running ? "Generating…" : "Generate article"}
      </button>

      {log.length > 0 && (
        <ul className="admin-gen-log" aria-live="polite">
          {log.map((line, i) => (
            <li key={`${i}-${line.text}`} className={line.kind}>
              {line.text}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
