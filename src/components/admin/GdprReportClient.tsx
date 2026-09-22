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

const CHECKLIST = [
  "Consent stored first-party (cfo_consent) — not a third-party CMP",
  "Non-essential cookies off until the visitor chooses",
  "Analytics / GA Consent Mode denied by default",
  "No full emails in cookies or analytics events",
  "Consent audit uses pseudonymized IP",
  "Visitor can reopen preferences anytime (footer)",
  "Analytics events retained ~180 days then deleted",
];

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
            Consent lawfulness and category opt-ins for the last 30 days.
            Traffic detail lives on{" "}
            <Link href="/admin/cookies-report">Cookies &amp; visitors</Link>.
          </>
        }
        action={
          <Link href="/admin/cookies-report" className="btn btn-ghost">
            Cookies report →
          </Link>
        }
      />

      <div className="admin-panel-bar">
        <div className="admin-link-row">
          <Link href="/admin/cookies-report" className="admin-ghost-btn">
            Open Cookies report
          </Link>
          <Link
            href="/privacy#cookies"
            target="_blank"
            className="admin-ghost-btn"
          >
            Public Privacy Policy
          </Link>
        </div>
        <span className="admin-chip">Window · 30 days</span>
      </div>

      {loading ? (
        <div className="admin-loading">Loading consent report…</div>
      ) : !data.available ? (
        <div className="admin-callout">
          <span className="admin-callout-kicker">Setup required</span>
          <h2>Consent table not ready</h2>
          <p>
            {data.detail ||
              "Run supabase/site-analytics.sql in the Supabase SQL Editor, then visitor Accept / Reject choices will appear here."}
          </p>
        </div>
      ) : (
        <>
          <div className="admin-metrics admin-metrics--4">
            <MetricCard
              label="Consent decisions"
              value={s.total}
              hint="30 days"
              tone="ink"
            />
            <MetricCard
              label="Accept all"
              value={s.acceptAll}
              hint={`${s.acceptRate}% of decisions`}
              tone="emerald"
            />
            <MetricCard
              label="Reject non-essential"
              value={s.rejectAll}
              hint="Necessary only"
            />
            <MetricCard
              label="Customized"
              value={s.custom}
              hint="Mixed categories"
              tone="brass"
            />
          </div>

          <div className="admin-metrics admin-metrics--4">
            <MetricCard
              label="Analytics granted"
              value={s.analyticsOn}
              hint={`${s.analyticsRate}%`}
              tone="emerald"
            />
            <MetricCard
              label="Marketing granted"
              value={s.marketingOn}
              hint={`${s.marketingRate}%`}
              tone="brass"
            />
            <MetricCard label="Necessary" value="Always on" hint="Cannot disable" />
            <MetricCard
              label="IP handling"
              value="Pseudo"
              hint="Last octet zeroed"
              tone="ink"
            />
          </div>

          <div className="admin-gdpr-grid">
            <section className="admin-card admin-checklist-card">
              <div className="admin-card-head">
                <h2>GDPR checklist</h2>
                <span className="admin-chip admin-chip--ok">Aligned</span>
              </div>
              <ul className="admin-checklist">
                {CHECKLIST.map((item) => (
                  <li key={item}>
                    <span className="admin-check" aria-hidden>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="admin-card admin-card--flush">
              <div className="admin-card-head admin-card-head--pad">
                <h2>Recent consent decisions</h2>
                <span className="admin-chip">{data.recent?.length || 0}</span>
              </div>
              {data.recent?.length ? (
                <ul className="admin-consent-feed">
                  {data.recent.map((row) => (
                    <li key={row.id}>
                      <div className="admin-consent-feed-main">
                        <span
                          className={`admin-pill admin-pill--${row.choice || "custom"}`}
                        >
                          {String(row.choice || "").replace(/_/g, " ")}
                        </span>
                        <span className="admin-consent-feed-flags">
                          Analytics {row.analytics ? "on" : "off"} · Marketing{" "}
                          {row.marketing ? "on" : "off"}
                        </span>
                      </div>
                      <time className="mono admin-consent-feed-time">
                        {new Date(row.created_at).toLocaleString()}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-empty admin-empty--pad">
                  No consent events yet. Open the public site and use Accept /
                  Reject to generate the first row.
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
