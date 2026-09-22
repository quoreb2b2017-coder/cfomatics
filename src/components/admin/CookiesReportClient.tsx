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
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="admin-card admin-card--flush admin-break-card">
      <div className="admin-card-head admin-card-head--pad">
        <h2>{title}</h2>
        <span className="admin-chip">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="admin-empty admin-empty--pad">No data yet.</p>
      ) : (
        <ul className="admin-break-list">
          {rows.map((row) => (
            <li key={`${title}-${row.key}`}>
              <div className="admin-break-row">
                <span className="admin-break-key" title={row.key}>
                  {row.key}
                </span>
                <strong className="admin-break-count">{row.count}</strong>
              </div>
              <div className="admin-break-track" aria-hidden>
                <span
                  className="admin-break-fill"
                  style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "emerald" | "brass" | "ink";
}) {
  return (
    <div className={`admin-metric admin-metric--${tone}`}>
      <span className="admin-metric-label">{label}</span>
      <span className="admin-metric-value">{value}</span>
      {hint ? <span className="admin-metric-hint">{hint}</span> : null}
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
  const consentTotal = (data.consentBreakdown || []).reduce(
    (sum, row) => sum + row.count,
    0,
  );

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
        kicker="Privacy intelligence"
        title="Cookies & visitors"
        description={
          <>
            First-party page views, sessions, campaigns, and approximate geo.
            Consent lawfulness lives on{" "}
            <Link href="/admin/gdpr">GDPR</Link>. IPs are pseudonymized — no full
            emails stored.
          </>
        }
        action={
          <Link href="/admin/gdpr" className="btn btn-ghost">
            Open GDPR →
          </Link>
        }
      />

      <div className="admin-panel-bar">
        <div className="admin-seg">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={range === r.id ? "is-active" : undefined}
              onClick={() => setRange(r.id)}
              data-testid={`cookies-range-${r.id}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="admin-panel-actions">
          <button
            type="button"
            className="admin-ghost-btn"
            onClick={() => void load(range)}
          >
            Refresh
          </button>
          <button type="button" className="admin-ghost-btn" onClick={exportCsv}>
            Export CSV
          </button>
          <button type="button" className="admin-ghost-btn" onClick={exportJson}>
            Export JSON
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading visitor report…</div>
      ) : !data.available ? (
        <div className="admin-callout">
          <span className="admin-callout-kicker">Setup required</span>
          <h2>Analytics tables not ready</h2>
          <p>
            {data.detail ||
              "Run supabase/site-analytics.sql in the Supabase SQL Editor, then Accept/Reject on the public site to populate this report."}
          </p>
          <Link href="/privacy#cookies" target="_blank" className="admin-card-link">
            View public Privacy Policy →
          </Link>
        </div>
      ) : (
        <>
          <div className="admin-metrics admin-metrics--4">
            <MetricCard
              label="Page views"
              value={m.pageViews}
              hint="With analytics consent"
              tone="emerald"
            />
            <MetricCard
              label="Unique sessions"
              value={m.uniqueSessions}
              hint="Distinct visitor ids"
              tone="ink"
            />
            <MetricCard
              label="Consent events"
              value={m.consentEvents}
              hint="Preference saves"
              tone="brass"
            />
            <MetricCard
              label="Total events"
              value={m.totalEvents}
              hint={`Range · ${range}`}
            />
          </div>

          <div className="admin-card admin-card--flush">
            <div className="admin-card-head admin-card-head--pad">
              <h2>Consent breakdown</h2>
              <span className="admin-chip">{consentTotal} events</span>
            </div>
            {(data.consentBreakdown || []).length === 0 ? (
              <p className="admin-empty admin-empty--pad">
                No consent events in range.
              </p>
            ) : (
              <ul className="admin-consent-bars">
                {data.consentBreakdown.map((row) => {
                  const pct = consentTotal
                    ? Math.round((row.count / consentTotal) * 100)
                    : 0;
                  return (
                    <li key={`${row.analytics}-${row.marketing}`}>
                      <div className="admin-consent-meta">
                        <span>{consentLabel(row.analytics, row.marketing)}</span>
                        <strong>
                          {row.count} · {pct}%
                        </strong>
                      </div>
                      <div className="admin-break-track" aria-hidden>
                        <span
                          className="admin-break-fill admin-break-fill--brass"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="admin-break-grid">
            <BreakdownList title="Top paths" rows={data.topPaths || []} />
            <BreakdownList title="UTM / campaigns" rows={data.campaigns || []} />
            <BreakdownList title="Devices" rows={data.devices || []} />
            <BreakdownList title="Countries" rows={data.countries || []} />
            <BreakdownList title="Cities" rows={data.cities || []} />
            <BreakdownList title="Time zones" rows={data.timeZones || []} />
          </div>

          <div className="admin-card admin-card--flush">
            <div className="admin-card-head admin-card-head--pad">
              <h2>Recent events</h2>
              <span className="admin-chip">{(data.recent || []).length} shown</span>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table admin-table--dense">
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
                      <td className="mono admin-td-now">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        <span className={`admin-pill admin-pill--${row.kind}`}>
                          {row.kind}
                        </span>
                      </td>
                      <td className="mono" title={row.path || ""}>
                        {(row.path || "—").slice(0, 42)}
                      </td>
                      <td className="mono">{row.sessionId || "—"}</td>
                      <td>
                        <span className="admin-flag">
                          {row.analytics ? "A" : "—"}
                        </span>
                        <span className="admin-flag">
                          {row.marketing ? "M" : "—"}
                        </span>
                      </td>
                      <td className="mono">{row.pseudonymizedIp || "—"}</td>
                      <td className="mono">
                        {[row.city, row.country].filter(Boolean).join(", ") ||
                          "—"}
                      </td>
                      <td className="mono">
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
