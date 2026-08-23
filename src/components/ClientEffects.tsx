'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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
      { threshold: 0.1 }
    );

    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    const onSubmit = (e: Event) => {
      e.preventDefault();
      const f = e.target as HTMLFormElement;
      const b = f.querySelector("button");
      if (b) {
        b.textContent = "✓ Subscribed";
        (b as HTMLButtonElement).disabled = true;
      }
      f.querySelectorAll("input").forEach((i) => {
        (i as HTMLInputElement).value = "";
      });
    };

    const forms = Array.from(document.querySelectorAll("form"));
    forms.forEach((f) => f.addEventListener("submit", onSubmit));

    return () => {
      io.disconnect();
      forms.forEach((f) => f.removeEventListener("submit", onSubmit));
    };
    // Re-run on every route change: client-side navigation swaps the DOM
    // without remounting this component, so .reveal elements on the new
    // page and any new <form>s need to be (re-)observed/(re-)bound.
  }, [pathname]);

  return null;
}
