export const SUBSCRIBED_KEY = "cfomatics_subscribed";
export const OPEN_SUBSCRIBE_EVENT = "open-subscribe-popup";

export type SubscribePayload = {
  email: string;
  source?: string;
  articleId?: string | null;
  articleSlug?: string | null;
  articleTitle?: string | null;
  topicId?: string | null;
  topicSlug?: string | null;
  topicName?: string | null;
};

export async function submitSubscribe(payload: SubscribePayload) {
  const res = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Could not subscribe");
  }
}

export function openSubscribePopup() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_SUBSCRIBE_EVENT));
}

// Page-specific popups (e.g. article) take over the open event from the
// site-wide host so the signup keeps its article/topic context.
let contextualPopups = 0;

export function registerContextualPopup() {
  contextualPopups += 1;
  return () => {
    contextualPopups = Math.max(0, contextualPopups - 1);
  };
}

export function hasContextualPopup() {
  return contextualPopups > 0;
}
