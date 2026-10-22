"use client";

import { useState } from "react";
import type { ResourceInsideSection } from "@/types/database";

export default function ReadFullDescription({
  description,
  sections,
}: {
  description: string;
  sections: ResourceInsideSection[];
}) {
  const [open, setOpen] = useState(false);
  const text = description.trim();
  const first = sections.find((section) => section.heading || section.body);
  const rest = sections.filter((section) => section !== first);
  const preview = [first?.body, text].filter(Boolean).join(" ");
  const long = preview.length > 160 || rest.length > 0;

  return (
    <div className="res-inside">
      <p className="res-inside-kicker">What&apos;s inside</p>
      <h2>{first?.heading || "Key insights from this download"}</h2>
      {open ? (
        <>
          {first?.body ? <p className="res-inside-copy">{first.body}</p> : null}
          {text ? <p className="res-inside-copy">{text}</p> : null}
          {rest.map((section) => (
            <section key={`${section.heading}-${section.body.slice(0, 20)}`}>
              {section.heading ? <h3>{section.heading}</h3> : null}
              {section.body ? <p>{section.body}</p> : null}
            </section>
          ))}
        </>
      ) : preview ? (
        <p className="res-inside-copy res-inside-clamp">{preview}</p>
      ) : null}
      {long ? (
        <button type="button" className="res-read-more" onClick={() => setOpen((value) => !value)}>
          {open ? "Show less" : "Read full description"}
          <span aria-hidden>{open ? " ↑" : " →"}</span>
        </button>
      ) : null}
    </div>
  );
}
