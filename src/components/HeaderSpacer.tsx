"use client";

import { useEffect, useRef } from "react";

/** Reserves space under the fixed header so content isn't covered. */
export default function HeaderSpacer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const spacer = ref.current;
    if (!header || !spacer) return;

    const sync = () => {
      spacer.style.height = `${header.offsetHeight}px`;
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(header);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return <div className="site-header-spacer" ref={ref} aria-hidden />;
}
