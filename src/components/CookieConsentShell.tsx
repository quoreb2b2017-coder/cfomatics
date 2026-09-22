"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-load consent/analytics after the main shell hydrates.
 * Keeps GA + banner + beacon off the critical SSR/JS path.
 */
const CookieConsentChrome = dynamic(
  () => import("@/components/CookieConsentChrome"),
  { ssr: false, loading: () => null },
);

export default function CookieConsentShell() {
  return <CookieConsentChrome />;
}
