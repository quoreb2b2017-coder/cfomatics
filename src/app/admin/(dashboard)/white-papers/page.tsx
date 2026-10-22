import AdminPageHeader from "@/components/admin/AdminPageHeader";
import WhitePapersAdmin from "@/components/admin/WhitePapersAdmin";
import { createClient } from "@/lib/supabase/server";
import { normalizeResource, VERTICALS } from "@/lib/resources";
import type { ResourceItem } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminWhitePapersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("updated_at", { ascending: false });

  const items = ((data ?? []) as ResourceItem[]).map(normalizeResource);
  const published = items.filter((item) => item.status === "published");
  const byVertical = VERTICALS.map((vertical) => ({
    ...vertical,
    count: published.filter(
      (item) => item.vertical_slug === vertical.slug || item.vertical === vertical.label,
    ).length,
  }));

  return (
    <>
      <AdminPageHeader
        kicker="Manage"
        title="White papers"
        description="Upload a white paper, report, case study, or webinar. The category decides which public section lists it."
      />
      {error && (
        <p className="admin-empty" style={{ marginBottom: 16 }}>
          Could not load resources. Run <code>supabase/resources.sql</code> in the Supabase SQL Editor.
          {error.message ? ` (${error.message})` : ""}
        </p>
      )}
      <div className="admin-metrics admin-metrics--resources">
        <article className="admin-metric admin-metric--emerald">
          <span className="admin-metric-label">Published</span>
          <span className="admin-metric-value">{published.length}</span>
          <span className="admin-metric-hint">{items.length} uploaded</span>
        </article>
        {byVertical.map((vertical) => (
          <article key={vertical.slug} className="admin-metric admin-metric--compact">
            <span className="admin-metric-label">{vertical.label}</span>
            <span className="admin-metric-value">{vertical.count}</span>
            <span className="admin-metric-hint">Published</span>
          </article>
        ))}
      </div>
      <WhitePapersAdmin initial={items} />
    </>
  );
}
