"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  OPEN_SUBSCRIBE_EVENT,
  SUBSCRIBED_KEY,
  hasContextualPopup,
  registerContextualPopup,
  leadSource,
  submitSubscribe,
} from "@/lib/subscribe-client";

export default function SubscribePopup({
  articleId,
  articleSlug,
  articleTitle,
  topicId,
  topicSlug,
  topicName,
  siteWide = false,
}: {
  articleId?: string;
  articleSlug?: string;
  articleTitle?: string;
  topicId?: string;
  topicSlug?: string;
  topicName?: string;
  /** Site-wide host: never auto-opens, only responds to openSubscribePopup(). */
  siteWide?: boolean;
}) {
  const pathname = usePathname();
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (siteWide) return;
    if (window.localStorage.getItem(SUBSCRIBED_KEY) === "1") return;

    const timer = window.setTimeout(() => setOpen(true), 450);
    return () => window.clearTimeout(timer);
  }, [siteWide]);

  useEffect(() => {
    const unregister = siteWide ? undefined : registerContextualPopup();

    function onOpen() {
      if (siteWide && hasContextualPopup()) return;
      setDone(false);
      setError("");
      setOpen(true);
    }

    window.addEventListener(OPEN_SUBSCRIBE_EVENT, onOpen);
    return () => {
      window.removeEventListener(OPEN_SUBSCRIBE_EVENT, onOpen);
      unregister?.();
    };
  }, [siteWide]);

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
      const lead = leadSource(pathname || "/", {
        slug: articleSlug,
        title: articleTitle,
      });
      await submitSubscribe({
        email,
        source: siteWide ? "navbar" : "popup",
        articleId,
        articleSlug,
        articleTitle,
        topicId,
        topicSlug,
        topicName,
        sourceType: lead.sourceType,
        sourceSlug: lead.sourceSlug,
        sourceTitle: lead.sourceTitle || articleTitle || null,
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
          <label htmlFor={inputId} className="sr-only">
            Work email
          </label>
          <input
            ref={inputRef}
            id={inputId}
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
