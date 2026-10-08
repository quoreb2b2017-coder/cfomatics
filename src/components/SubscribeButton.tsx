"use client";

import { openSubscribePopup } from "@/lib/subscribe-client";

export default function SubscribeButton({
  className,
  children = "Subscribe",
  onBeforeOpen,
}: {
  className?: string;
  children?: React.ReactNode;
  onBeforeOpen?: () => void;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      onClick={() => {
        onBeforeOpen?.();
        // Let any closing drawer release body scroll before the popup locks it.
        window.setTimeout(openSubscribePopup, 0);
      }}
    >
      {children}
    </button>
  );
}
