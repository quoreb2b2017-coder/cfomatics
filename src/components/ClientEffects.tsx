"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SUBSCRIBED_KEY, submitSubscribe } from "@/lib/subscribe-client";

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

      void submitSubscribe({
        email,
        source: f.dataset.source || "site",
        articleId: f.dataset.articleId || null,
        articleSlug: f.dataset.articleSlug || null,
        articleTitle: f.dataset.articleTitle || null,
        topicId: f.dataset.topicId || null,
        topicSlug: f.dataset.topicSlug || null,
        topicName: f.dataset.topicName || null,
      })
        .then(() => {
          try {
            window.localStorage.setItem(SUBSCRIBED_KEY, "1");
          } catch {
            // ignore
          }
          if (b) b.textContent = "✓ Subscribed";
          f.querySelectorAll("input").forEach((i) => {
            if ((i as HTMLInputElement).type !== "checkbox") {
              (i as HTMLInputElement).value = "";
            }
          });
        })
        .catch(() => {
          if (b) {
            b.textContent = prevLabel || "Subscribe";
            b.disabled = false;
          }
          window.alert("Could not subscribe. Try again.");
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
