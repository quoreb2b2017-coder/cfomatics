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
  sourceType?: string | null;
  sourceSlug?: string | null;
  sourceTitle?: string | null;
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

const SECTION_TYPE: Record<string, string> = {
  whitepapers: "whitepaper",
  reports: "report",
  "case-studies": "case_study",
  guides: "guide",
  webinars: "webinar",
};

export function leadSource(
  pathname: string,
  hints?: { slug?: string | null; title?: string | null },
) {
  const article = pathname.match(/^\/article\/([^/]+)/);
  if (article) {
    return {
      sourceType: "blog",
      sourceSlug: hints?.slug || article[1],
      sourceTitle: hints?.title || null,
    };
  }
  if (pathname === "/blog" || pathname.startsWith("/blog/")) {
    return { sourceType: "blog", sourceSlug: null, sourceTitle: "Blog" };
  }
  const resource = pathname.match(
    /^\/resources\/(whitepapers|reports|case-studies|guides|webinars)\/([^/]+)/,
  );
  if (resource) {
    return {
      sourceType: SECTION_TYPE[resource[1]] ?? "site",
      sourceSlug: hints?.slug || resource[2],
      sourceTitle: hints?.title || null,
    };
  }
  return {
    sourceType: "site",
    sourceSlug: hints?.slug || null,
    sourceTitle: hints?.title || null,
  };
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
