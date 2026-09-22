"use client";

import { openCookiePreferences } from "@/lib/consent";

/** Footer / inline control that re-opens cookie preferences anytime. */
export default function CookiePreferencesTrigger({
  className = "",
  children = "Cookie preferences",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={() => openCookiePreferences()}
      className={className}
      data-testid="cookie-preferences-trigger"
      {...props}
    >
      {children}
    </button>
  );
}
