import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function rangeStart(range: string): string {
  const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
  const d = new Date();
  if (range === "today") {
    d.setHours(0, 0, 0, 0);
  } else {
    d.setTime(d.getTime() - days * 86400000);
  }
  return d.toISOString();
}

function countBy(
  rows: Array<Record<string, unknown>>,
  keyFn: (r: Record<string, unknown>) => string,
  limit = 12,
) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row) || "(unknown)";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

function emptyMetrics() {
  return {
    pageViews: 0,
    uniqueSessions: 0,
    consentEvents: 0,
    totalEvents: 0,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (auth.error) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error === "Unauthorized" ? 401 : 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "7d";
  const since = rangeStart(range);
  const db = createAdminClient();

  const { data, error } = await db
    .from("site_analytics_events")
    .select(
      "id, kind, session_id, path, referrer, consent_snapshot, marketing_meta, custom_meta, created_at",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({
      available: false,
      detail: error.message,
      range,
      metrics: emptyMetrics(),
      topPaths: [],
      campaigns: [],
      devices: [],
      countries: [],
      cities: [],
      timeZones: [],
      consentBreakdown: [],
      recent: [],
    });
  }

  const rows = (data || []) as Array<Record<string, unknown>>;
  const pageViews = rows.filter((r) => r.kind === "page_view");
  const consents = rows.filter((r) => r.kind === "consent");
  const sessions = new Set(rows.map((r) => String(r.session_id || ""))).size;

  const consentBreakdownMap = new Map<string, number>();
  for (const r of consents) {
    const snap = (r.consent_snapshot || {}) as Record<string, unknown>;
    const key = `a:${snap.analytics ? 1 : 0}|m:${snap.marketing ? 1 : 0}`;
    consentBreakdownMap.set(key, (consentBreakdownMap.get(key) || 0) + 1);
  }

  const consentBreakdown = [...consentBreakdownMap.entries()].map(
    ([key, count]) => {
      const analytics = key.includes("a:1");
      const marketing = key.includes("m:1");
      return { analytics, marketing, count };
    },
  );

  const recent = rows.slice(0, 40).map((r) => {
    const snap = (r.consent_snapshot || {}) as Record<string, unknown>;
    const meta = (r.marketing_meta || {}) as Record<string, unknown>;
    return {
      id: r.id,
      createdAt: r.created_at,
      kind: r.kind,
      path: r.path,
      sessionId: String(r.session_id || "").slice(0, 12),
      analytics: !!snap.analytics,
      marketing: !!snap.marketing,
      pseudonymizedIp: snap.pseudonymizedIp || meta.pseudonymizedIp || null,
      country: meta.country || null,
      city: meta.city || null,
      utmSource: meta.utmSource || null,
      utmMedium: meta.utmMedium || null,
      utmCampaign: meta.utmCampaign || null,
    };
  });

  return NextResponse.json({
    available: true,
    range,
    metrics: {
      pageViews: pageViews.length,
      uniqueSessions: sessions,
      consentEvents: consents.length,
      totalEvents: rows.length,
    },
    topPaths: countBy(pageViews, (r) => String(r.path || "/")),
    campaigns: countBy(
      pageViews.filter(
        (r) => (r.marketing_meta as Record<string, unknown>)?.utmSource,
      ),
      (r) => {
        const m = (r.marketing_meta || {}) as Record<string, unknown>;
        return (
          [m.utmSource, m.utmMedium, m.utmCampaign].filter(Boolean).join(" / ") ||
          "(none)"
        );
      },
    ),
    devices: countBy(pageViews, (r) =>
      String(
        ((r.marketing_meta || {}) as Record<string, unknown>).deviceCategory ||
          "unknown",
      ),
    ),
    countries: countBy(pageViews, (r) =>
      String(
        ((r.marketing_meta || {}) as Record<string, unknown>).country ||
          "unknown",
      ),
    ),
    cities: countBy(pageViews, (r) =>
      String(
        ((r.marketing_meta || {}) as Record<string, unknown>).city || "unknown",
      ),
    ),
    timeZones: countBy(pageViews, (r) =>
      String(
        ((r.marketing_meta || {}) as Record<string, unknown>).timeZone ||
          "unknown",
      ),
    ),
    consentBreakdown,
    recent,
  });
}
