import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: publishedCount }, { count: draftCount }, { count: topicCount }, { data: logs }] =
    await Promise.all([
      supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft"),
      supabase.from("topics").select("*", { count: "exact", head: true }),
      supabase
        .from("generation_log")
        .select("*, article:articles(slug, title)")
        .order("run_at", { ascending: false })
        .limit(10),
    ]);

  return (
    <>
      <h1>Dashboard</h1>

      <div className="admin-stats">
        <div className="admin-stat">
          <span className="n">{publishedCount ?? 0}</span>
          <span className="l">Published articles</span>
        </div>
        <div className="admin-stat">
          <span className="n">{draftCount ?? 0}</span>
          <span className="l">Drafts</span>
        </div>
        <div className="admin-stat">
          <span className="n">{topicCount ?? 0}</span>
          <span className="l">Topics</span>
        </div>
      </div>

      <div className="admin-card">
        <h2>AI auto-publish history</h2>
        {!logs || logs.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
            No generation runs yet. The scheduled cron job at{" "}
            <code>/api/cron/generate-article</code> will log every attempt
            here once it fires (see <code>vercel.json</code> for the
            schedule).
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Status</th>
                <th>Topic</th>
                <th>Article</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.run_at).toLocaleString()}</td>
                  <td>
                    <span className={`admin-badge ${log.status}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>{log.topic_searched ?? "—"}</td>
                  <td>
                    {(log as unknown as { article?: { slug: string; title: string } })
                      .article?.title ?? "—"}
                  </td>
                  <td style={{ maxWidth: 260, fontSize: 12, color: "#a02020" }}>
                    {log.error_message ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
