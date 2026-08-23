import { NextResponse } from "next/server";
import { saveSubscriber } from "@/lib/subscribers";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email : "";

  try {
    await saveSubscriber({
      email,
      source: typeof data.source === "string" ? data.source : "site",
      articleId: typeof data.articleId === "string" ? data.articleId : null,
      articleSlug:
        typeof data.articleSlug === "string" ? data.articleSlug : null,
      articleTitle:
        typeof data.articleTitle === "string" ? data.articleTitle : null,
      topicId: typeof data.topicId === "string" ? data.topicId : null,
      topicSlug: typeof data.topicSlug === "string" ? data.topicSlug : null,
      topicName: typeof data.topicName === "string" ? data.topicName : null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not subscribe";
    const status = message.includes("valid work email") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
