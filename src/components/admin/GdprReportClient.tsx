"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type GdprData = {
  available: boolean;
  detail?: string;
  stats: {
    total: number;
    acceptAll: number;
    rejectAll: number;
    custom: number;
    analyticsOn: number;
    marketingOn: number;
    analyticsRate: number;
    marketingRate: number;
    acceptRate: number;
  };
  recent: Array<{
    id: string;
    choice: string;
    analytics: boolean;
    marketing: boolean;
    created_at: string;
  }>;
};

const EMPTY: GdprData = {
  available: false,
  stats: {
    total: 0,
    acceptAll: 0,
    rejectAll: 0,
    custom: 0,
    analyticsOn: 0,
    marketingOn: 0,
    analyticsRate: 0,
    marketingRate: 0,
    acceptRate: 0,
  },
  recent: [],
};

export default function GdprReportClient() {
  const [data, setData] = useState<GdprData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/consent", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((json: GdprData) =>
        setData({
          ...EMPTY,
          ...json,
          stats: { ...EMPTY.stats, ...(json.stats || {}) },
        }),
      )
      .catch(() => setData(EMPTY))
      .finally(() => setLoading(false));
  }, []);

  const s = data.stats;

  return (
    <>
      <AdminPageHeader
        kicker="Compliance"
        title="GDPR"
        description={
          <>
            Consent lawfulness and category opt-ins (last 30 days). Visitor
            analytics:{" "}
            <Link href="/admin/cookies-report">Cookies &amp; visitors</Link>.
          </>
        }
      />

      <p style={{ marginBottom: 20 }}>
        <Link href="/admin/cookies-report" className="admin-card-link">
          Open Cookies report →
        </Link>
        {" · "}
        <Link href="/privacy#cookies" target="_blank" className="admin-card-link">
          Public Privacy Policy →
        </Link>
      </p>

      {loading ? (
        <p className="admin-empty">Loading…</p>
      ) : !data.available ? (
        <div className="admin-card">
          <h2>Setup required</h2>
          <p className="admin-empty">
            {data.detail ||
              "Run supabase/site-analytics.sql in the Supabase SQL Editor, then visitor Accept / Reject choices will appear here."}
          </p>
        </div>
      ) : (
        <>
          <div
            className="admin-stats"
            style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
          >
            <div className="admin-stat">
              <span className="admin-stat-label mono">Consent decisions</span>
              <span className="n">{s.total}</span>
              <span className="l">30 days</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-label mono">Accept all</span>
              <span className="n">{s.acceptAll}</span>
              <span className="l">{s.acceptRate}%</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-label mono">Reject non-essential</span>
              <span className="n">{s.rejectAll}</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-label mono">Customized</span>
              <span className="n">{s.custom}</span>
            </div>
          </div>

          <div
            className="admin-stats"
            style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
          >
            <div className="admin-stat">
              <span className="admin-stat-label mono">Analytics granted</span>
              <span className="n">{s.analyticsOn}</span>
              <span className="l">{s.analyticsRate}%</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-label mono">Marketing granted</span>
              <span className="n">{s.marketingOn}</span>
              <span className="l">{s.marketingRate}%</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-label mono">Necessary</span>
              <span className="n" style={{ fontSize: 22 }}>
                Always on
              </span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-label mono">IP handling</span>
              <span className="n" style={{ fontSize: 22 }}>
                Pseudo
              </span>
              <span className="l">Last octet zeroed</span>
            </div>
          </div>

          <div className="admin-card">
            <h2>GDPR checklist</h2>
            <ul style={{ margin: "12px 0 0", paddingLeft: 18, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.7 }}>
              <li>
                Consent stored first-party (<code>cfo_consent</code>) — not a
                third-party CMP
              </li>
              <li>Non-essential off until the visitor chooses</li>
              <li>Analytics / GA Consent Mode denied by default</li>
              <li>No full emails in cookies or analytics events</li>
              <li>Consent audit uses pseudonymized IP</li>
              <li>Visitor can reopen preferences anytime (footer)</li>
              <li>Analytics events retained ~180 days then deleted</li>
            </ul>
          </div>

          <div className="admin-card admin-card--flush">
            <div className="admin-card-head" style={{ padding: "16px 20px", margin: 0 }}>
              <h2>Recent consent decisions</h2>
            </div>
            {data.recent?.length ? (
              <ul className="admin-recent">
                {data.recent.map((row) => (
                  <li key={row.id}>
                    <div>
                      <strong className="mono" style={{ fontSize: 12 }}>
                        {String(row.choice || "").replace(/_/g, " ")}
                      </strong>
                      <span className="admin-td-sub" style={{ display: "block" }}>
                        Analytics {row.analytics ? "on" : "off"} · Marketing{" "}
                        {row.marketing ? "on" : "off"}
                      </span>
                    </div>
                    <span className="admin-td-sub mono" style={{ fontSize: 11 }}>
                      {new Date(row.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-empty" style={{ padding: "16px 20px" }}>
                No consent events yet. Open the public site and use Accept /
                Reject to generate the first row.
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}
