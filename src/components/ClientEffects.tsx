"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SUBSCRIBED_KEY, leadSource, submitSubscribe } from "@/lib/subscribe-client";

export default function ClientEffects() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("js");

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    const onSubmit = (e: Event) => {
      e.preventDefault();
      const f = e.target as HTMLFormElement;
      const input = f.querySelector(
        'input[type="email"]',
      ) as HTMLInputElement | null;
      const b = f.querySelector("button") as HTMLButtonElement | null;
      const email = input?.value.trim() ?? "";
      if (!email) return;

      const prevLabel = b?.textContent;
      if (b) {
        b.textContent = "Saving…";
        b.disabled = true;
      }

      const lead = leadSource(pathname, {
        slug: f.dataset.articleSlug || f.dataset.sourceSlug || null,
        title:
          f.dataset.articleTitle ||
          f.dataset.sourceTitle ||
          document.querySelector("h1")?.textContent?.trim() ||
          null,
      });
      void submitSubscribe({
        email,
        source: f.dataset.source || lead.sourceType || "site",
        articleId: f.dataset.articleId || null,
        articleSlug: f.dataset.articleSlug || lead.sourceSlug,
        articleTitle: f.dataset.articleTitle || lead.sourceTitle,
        topicId: f.dataset.topicId || null,
        topicSlug: f.dataset.topicSlug || null,
        topicName: f.dataset.topicName || null,
        sourceType: lead.sourceType,
        sourceSlug: lead.sourceSlug,
        sourceTitle: lead.sourceTitle,
      })
        .then(() => {
          try {
            window.localStorage.setItem(SUBSCRIBED_KEY, "1");
          } catch {
            // ignore
          }
          showFormNote(f, "");
          if (input) input.value = "";
          if (b) {
            b.textContent = "✓ Subscribed";
            b.disabled = false;
            window.setTimeout(() => {
              if (prevLabel) b.textContent = prevLabel;
            }, 1200);
          }
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "Could not subscribe. Try again.";
          if (b) {
            b.textContent = prevLabel || "Subscribe";
            b.disabled = false;
          }
          showFormNote(f, message);
        });
    };

    const forms = Array.from(
      document.querySelectorAll("form.js-fake-subscribe"),
    );
    forms.forEach((f) => f.addEventListener("submit", onSubmit));

    return () => {
      io.disconnect();
      forms.forEach((f) => f.removeEventListener("submit", onSubmit));
    };
  }, [pathname]);

  return null;
}

function showFormNote(form: HTMLFormElement, message: string) {
  let note = form.querySelector<HTMLParagraphElement>(".sub-form-note");
  if (!message) {
    note?.remove();
    return;
  }
  if (!note) {
    note = document.createElement("p");
    note.className = "sub-form-note";
    form.appendChild(note);
  }
  note.textContent = message;
}
