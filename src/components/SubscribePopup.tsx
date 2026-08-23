"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SUBSCRIBED_KEY, submitSubscribe } from "@/lib/subscribe-client";

export default function SubscribePopup({
  articleId,
  articleSlug,
  articleTitle,
  topicId,
  topicSlug,
  topicName,
}: {
  articleId?: string;
  articleSlug?: string;
  articleTitle?: string;
  topicId?: string;
  topicSlug?: string;
  topicName?: string;
}) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(SUBSCRIBED_KEY) === "1") return;

    const timer = window.setTimeout(() => setOpen(true), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = inputRef.current?.value.trim() ?? "";
    setError("");
    setPending(true);
    try {
      await submitSubscribe({
        email,
        source: "popup",
        articleId,
        articleSlug,
        articleTitle,
        topicId,
        topicSlug,
        topicName,
      });
      try {
        window.localStorage.setItem(SUBSCRIBED_KEY, "1");
      } catch {
        // ignore quota / private mode
      }
      setDone(true);
      window.setTimeout(() => setOpen(false), 1100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not subscribe");
    } finally {
      setPending(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="subpop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="subpop-backdrop"
        aria-label="Close subscribe popup"
        onClick={() => setOpen(false)}
      />
      <div className="subpop-card">
        <button
          type="button"
          className="subpop-close"
          aria-label="Close"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
        <p className="subpop-kicker">CFOmatics briefing</p>
        <h2 id={titleId}>Subscribe now</h2>
        <p className="subpop-copy">
          {articleTitle
            ? "Get this kind of CFO analysis in your inbox. Five minutes, every morning."
            : "Finance news worth five minutes, every morning."}
        </p>
        <form className="subpop-form" onSubmit={onSubmit}>
          <label htmlFor="article-sub-email" className="sr-only">
            Work email
          </label>
          <input
            ref={inputRef}
            id="article-sub-email"
            type="email"
            name="email"
            placeholder="Work email"
            required
            autoComplete="email"
            disabled={done || pending}
          />
          <button
            type="submit"
            className="btn btn-solid"
            disabled={done || pending}
          >
            {done ? "✓ Subscribed" : pending ? "Saving…" : "Subscribe now"}
          </button>
        </form>
        {error ? <p className="subpop-note">{error}</p> : (
          <p className="subpop-note">Free. Unsubscribe anytime.</p>
        )}
      </div>
    </div>
  );
}
