"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  CONSENT_EVENT,
  applyGoogleConsent,
  getConsent,
  type ConsentState,
} from "@/lib/consent";

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

/**
 * Loads GA4 with Consent Mode defaults denied until the visitor opts in.
 * Safe to mount site-wide; no-ops when measurement ID is missing.
 */
export default function GoogleAnalytics() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!MEASUREMENT_ID || !MEASUREMENT_ID.startsWith("G-")) return;

    window.dataLayer = window.dataLayer || [];
    // GA expects the Arguments object, not a plain array.
    function gtag(..._args: unknown[]) {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    }
    window.gtag = gtag;

    gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500,
    });

    gtag("js", new Date());
    gtag("config", MEASUREMENT_ID, {
      anonymize_ip: true,
      send_page_view: false,
    });

    const existing = getConsent();
    if (existing) {
      applyGoogleConsent(existing);
      if (existing.analytics) {
        gtag("event", "page_view", {
          page_path: window.location.pathname + window.location.search,
        });
      }
    }

    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<ConsentState>).detail;
      applyGoogleConsent(detail || getConsent());
      if (detail?.analytics && typeof window.gtag === "function") {
        window.gtag("event", "page_view", {
          page_path: window.location.pathname + window.location.search,
        });
      }
    };

    window.addEventListener(CONSENT_EVENT, onUpdate);
    setReady(true);
    return () => window.removeEventListener(CONSENT_EVENT, onUpdate);
  }, []);

  if (!MEASUREMENT_ID || !MEASUREMENT_ID.startsWith("G-") || !ready) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
      strategy="afterInteractive"
    />
  );
}
