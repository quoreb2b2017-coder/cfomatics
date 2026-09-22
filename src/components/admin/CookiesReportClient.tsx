"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const RANGES = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
] as const;

type CountRow = { key: string; count: number };
type ConsentBreak = { analytics: boolean; marketing: boolean; count: number };
type RecentRow = {
  id: string;
  createdAt: string;
  kind: string;
  path: string | null;
  sessionId: string;
  analytics: boolean;
  marketing: boolean;
  pseudonymizedIp: string | null;
  country: string | null;
  city: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

type ReportData = {
  available: boolean;
  detail?: string;
  metrics: {
    pageViews: number;
    uniqueSessions: number;
    consentEvents: number;
    totalEvents: number;
  };
  topPaths: CountRow[];
  campaigns: CountRow[];
  devices: CountRow[];
  countries: CountRow[];
  cities: CountRow[];
  timeZones: CountRow[];
  consentBreakdown: ConsentBreak[];
  recent: RecentRow[];
};

const EMPTY: ReportData = {
  available: false,
  detail: "",
  metrics: {
    pageViews: 0,
    uniqueSessions: 0,
    consentEvents: 0,
    totalEvents: 0,
  },
  topPaths: [],
  campaigns: [],
  devices: [],
  countries: [],
  cities: [],
  timeZones: [],
  consentBreakdown: [],
  recent: [],
};

function consentLabel(analytics: boolean, marketing: boolean) {
  if (analytics && marketing) return "Analytics + marketing";
  if (analytics) return "Analytics only";
  if (marketing) return "Marketing only";
  return "Necessary only";
}

function BreakdownList({ title, rows }: { title: string; rows: CountRow[] }) {
  return (
    <div className="admin-card admin-card--flush">
      <div className="admin-card-head" style={{ padding: "16px 20px", margin: 0 }}>
        <h2>{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="admin-empty" style={{ padding: "16px 20px" }}>
          No data yet.
        </p>
      ) : (
        <ul className="admin-recent">
          {rows.map((row) => (
            <li key={`${title}-${row.key}`}>
              <span className="admin-td-sub" title={row.key}>
                {row.key}
              </span>
              <strong>{row.count}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CookiesReportClient() {
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("7d");
  const [data, setData] = useState<ReportData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/cookies-report?range=${encodeURIComponent(nextRange)}`,
        { credentials: "same-origin" },
      );
      const json = (await res.json()) as ReportData;
      setData({
        ...EMPTY,
        ...json,
        metrics: { ...EMPTY.metrics, ...(json.metrics || {}) },
      });
    } catch {
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [range, load]);

  const m = data.metrics;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cookies-visitors-${range}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const header = [
      "createdAt",
      "kind",
      "path",
      "sessionId",
      "analytics",
      "marketing",
      "pseudonymizedIp",
      "country",
      "city",
      "utmSource",
      "utmMedium",
      "utmCampaign",
    ];
    const lines = [header.join(",")];
    for (const row of data.recent || []) {
      lines.push(
        [
          row.createdAt,
          row.kind,
          `"${String(row.path || "").replace(/"/g, '""')}"`,
          row.sessionId,
          row.analytics,
          row.marketing,
          row.pseudonymizedIp || "",
          row.country || "",
          row.city || "",
          row.utmSource || "",
          row.utmMedium || "",
          row.utmCampaign || "",
        ].join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cookies-visitors-recent-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <AdminPageHeader
        kicker="GDPR / visitors"
        title="Cookies & visitors"
        description={
          <>
            First-party page views, sessions, campaigns, and approximate geo.
            Consent lawfulness:{" "}
            <Link href="/admin/gdpr">GDPR</Link>. IPs are pseudonymized; no full
            emails stored.
          </>
        }
      />

      <div className="admin-toolbar" style={{ marginBottom: 20 }}>
        <div className="admin-range-btns">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={
                range === r.id ? "btn btn-solid" : "btn btn-ghost"
              }
              onClick={() => setRange(r.id)}
              data-testid={`cookies-range-${r.id}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="admin-range-btns">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void load(range)}
          >
            Refresh
          </button>
          <button type="button" className="btn btn-ghost" onClick={exportCsv}>
            Export CSV
          </button>
          <button type="button" className="btn btn-ghost" onClick={exportJson}>
            Export JSON
          </button>
        </div>
      </div>

      {loading ? (
        <p className="admin-empty">Loading…</p>
      ) : !data.available ? (
        <div className="admin-card">
          <h2>Setup required</h2>
          <p className="admin-empty">
            {data.detail ||
              "Run supabase/site-analytics.sql in the Supabase SQL Editor, then Accept/Reject on the public site to populate this report."}
          </p>
          <p style={{ marginTop: 12 }}>
            <Link href="/privacy#cookies" target="_blank" className="admin-card-link">
              View public Privacy Policy →
            </Link>
          </p>
        </div>
      ) : (
        <>
          <div className="admin-stats" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            <div className="admin-stat">
              <span className="admin-stat-label mono">Page views</span>
              <span className="n">{m.pageViews}</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-label mono">Unique sessions</span>
              <span className="n">{m.uniqueSessions}</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-label mono">Consent events</span>
              <span className="n">{m.consentEvents}</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-label mono">Total events</span>
              <span className="n">{m.totalEvents}</span>
              <span className="l">{range}</span>
            </div>
          </div>

          <div className="admin-card admin-card--flush" style={{ marginBottom: 24 }}>
            <div className="admin-card-head" style={{ padding: "16px 20px", margin: 0 }}>
              <h2>Consent breakdown</h2>
            </div>
            {(data.consentBreakdown || []).length === 0 ? (
              <p className="admin-empty" style={{ padding: "16px 20px" }}>
                No consent events in range.
              </p>
            ) : (
              <ul className="admin-recent">
                {data.consentBreakdown.map((row) => (
                  <li key={`${row.analytics}-${row.marketing}`}>
                    <span className="admin-td-sub">
                      {consentLabel(row.analytics, row.marketing)}
                    </span>
                    <strong>{row.count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-dash-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
            <BreakdownList title="Top paths" rows={data.topPaths || []} />
            <BreakdownList title="UTM / campaigns" rows={data.campaigns || []} />
            <BreakdownList title="Devices" rows={data.devices || []} />
            <BreakdownList title="Countries" rows={data.countries || []} />
            <BreakdownList title="Cities" rows={data.cities || []} />
            <BreakdownList title="Time zones" rows={data.timeZones || []} />
          </div>

          <div className="admin-card admin-card--flush">
            <div className="admin-card-head" style={{ padding: "16px 20px", margin: 0 }}>
              <h2>Recent events</h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Kind</th>
                    <th>Path</th>
                    <th>Session</th>
                    <th>A / M</th>
                    <th>IP (pseudo)</th>
                    <th>Geo</th>
                    <th>UTM</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recent || []).map((row) => (
                    <tr key={row.id}>
                      <td className="mono" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {row.kind}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }} title={row.path || ""}>
                        {(row.path || "—").slice(0, 40)}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {row.sessionId || "—"}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {row.analytics ? "A" : "—"}/{row.marketing ? "M" : "—"}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {row.pseudonymizedIp || "—"}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {[row.city, row.country].filter(Boolean).join(", ") ||
                          "—"}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {[row.utmSource, row.utmMedium, row.utmCampaign]
                          .filter(Boolean)
                          .join(" / ") || "—"}
                      </td>
                    </tr>
                  ))}
                  {(data.recent || []).length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <p className="admin-empty">
                          No events yet. Accept analytics on the public site to
                          generate page views.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
