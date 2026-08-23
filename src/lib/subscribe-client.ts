export const SUBSCRIBED_KEY = "cfomatics_subscribed";

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
