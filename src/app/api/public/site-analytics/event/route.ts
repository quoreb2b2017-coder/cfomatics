import { NextResponse } from "next/server";
import { ingestSiteAnalyticsEvent } from "@/lib/site-analytics/ingest";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const result = await ingestSiteAnalyticsEvent(request, body);
  if (!result.ok) {
    return NextResponse.json(
      { detail: result.detail },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true, id: result.id });
}
