"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import SiteAnalyticsBeacon from "@/components/SiteAnalyticsBeacon";

/** Public-site consent + GA + first-party analytics. Skips /admin routes. */
export default function CookieConsentChrome() {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <GoogleAnalytics />
      <Suspense fallback={null}>
        <SiteAnalyticsBeacon />
      </Suspense>
      <CookieConsentBanner />
    </>
  );
}
