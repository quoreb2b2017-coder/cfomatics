"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CONSENT_EVENT,
  VID_COOKIE,
  getConsent,
  postSiteAnalyticsEvent,
} from "@/lib/consent";

/** Sends first-party page_view beacons only when analytics consent is granted. */
export default function SiteAnalyticsBeacon() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const lastKey = useRef("");

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SITE_ANALYTICS === "false") return;

    const send = () => {
      const consent = getConsent();
      if (!consent?.analytics) return;

      const path = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
      const key = `${readVidApprox()}:${path}`;
      if (lastKey.current === key) return;
      lastKey.current = key;

      postSiteAnalyticsEvent({ kind: "page_view", consent });
    };

    send();

    const onConsent = () => {
      lastKey.current = "";
      send();
    };

    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, [pathname, searchParams]);

  return null;
}

function readVidApprox() {
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${VID_COOKIE}=([^;]*)`),
    );
    return match ? decodeURIComponent(match[1]!) : "anon";
  } catch {
    return "anon";
  }
}
