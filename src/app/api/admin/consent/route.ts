import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function emptyStats() {
  return {
    total: 0,
    acceptAll: 0,
    rejectAll: 0,
    custom: 0,
    analyticsOn: 0,
    marketingOn: 0,
    analyticsRate: 0,
    marketingRate: 0,
    acceptRate: 0,
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

  const db = createAdminClient();
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data, error } = await db
    .from("consent_events")
    .select("id, choice, analytics, marketing, created_at")
    .gte("created_at", since30)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    return NextResponse.json({
      available: false,
      detail: error.message,
      stats: emptyStats(),
      recent: [],
    });
  }

  const rows = data || [];
  const total = rows.length;
  const acceptAll = rows.filter((r) => r.choice === "accept_all").length;
  const rejectAll = rows.filter((r) => r.choice === "reject_all").length;
  const custom = rows.filter((r) => r.choice === "custom").length;
  const analyticsOn = rows.filter((r) => r.analytics).length;
  const marketingOn = rows.filter((r) => r.marketing).length;

  return NextResponse.json({
    available: true,
    stats: {
      total,
      acceptAll,
      rejectAll,
      custom,
      analyticsOn,
      marketingOn,
      analyticsRate: total ? Math.round((analyticsOn / total) * 100) : 0,
      marketingRate: total ? Math.round((marketingOn / total) * 100) : 0,
      acceptRate: total ? Math.round((acceptAll / total) * 100) : 0,
    },
    recent: rows.slice(0, 12),
  });
}
