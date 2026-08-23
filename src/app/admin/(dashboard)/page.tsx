import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import type { ArticleWithTopic } from "@/types/database";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: publishedCount },
    { count: draftCount },
    { count: topicCount },
    { count: failedCount },
    { count: subscriberCount },
    { data: logs },
    { data: recentRows },
  ] = await Promise.all([
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
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
    supabase
      .from("generation_log")
      .select("*, article:articles(slug, title)")
      .order("run_at", { ascending: false })
      .limit(8),
    supabase
      .from("articles")
      .select("*, topic:topics(*)")
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  const recent = (recentRows ?? []) as unknown as ArticleWithTopic[];
  const lastRun = logs?.[0]?.run_at
    ? new Date(logs[0].run_at).toLocaleString()
    : "No runs yet";

  return (
    <>
      <AdminPageHeader
        kicker="Overview"
        title="Dashboard"
        description="Publishing health, recent stories, and AI auto-publish activity."
        action={
          <Link href="/admin/articles/new#generate" className="btn btn-solid">
            New article
          </Link>
        }
      />

      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat-label">Published</span>
          <span className="n">{publishedCount ?? 0}</span>
          <span className="l">Live on the public site</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Drafts</span>
          <span className="n">{draftCount ?? 0}</span>
          <span className="l">Waiting to publish</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Topics</span>
          <span className="n">{topicCount ?? 0}</span>
          <span className="l">Navbar sections</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Failed runs</span>
          <span className="n">{failedCount ?? 0}</span>
          <span className="l">Last run {lastRun}</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Subscribers</span>
          <span className="n">{subscriberCount ?? 0}</span>
          <span className="l">Emails from the public site</span>
        </div>
      </div>

      <div className="admin-dash-grid">
        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Recent articles</h2>
            <Link href="/admin/articles" className="admin-card-link">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="admin-empty">No articles yet.</p>
          ) : (
            <ul className="admin-recent">
              {recent.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/articles/${a.id}/edit`}>
                    <span className="admin-recent-title">{a.title}</span>
                    <span className="admin-recent-meta">
                      {a.topic?.name ?? "Uncategorized"}
                      <span className={`admin-badge ${a.status}`}>{a.status}</span>
                    </span>
                  </Link>
                  <Link
                    href={`/admin/articles/${a.id}/edit`}
                    className="btn btn-solid admin-recent-edit"
                  >
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Quick actions</h2>
          </div>
          <div className="admin-actions">
            <Link href="/admin/articles/new#generate" className="admin-action">
              <strong>Generate with AI</strong>
              <span>Topic + titles → article, image, SEO</span>
            </Link>
            <Link href="/admin/articles/new" className="admin-action">
              <strong>Write article</strong>
              <span>Create a manual story</span>
            </Link>
            <Link href="/admin/articles" className="admin-action">
              <strong>Review queue</strong>
              <span>Edit, publish, or unpublish</span>
            </Link>
            <Link href="/admin/topics" className="admin-action">
              <strong>Manage topics</strong>
              <span>Navbar categories</span>
            </Link>
            <Link href="/admin/subscribers" className="admin-action">
              <strong>Subscribers</strong>
              <span>Emails and which blogs they signed up for</span>
            </Link>
            <Link href="/" className="admin-action">
              <strong>Open public site</strong>
              <span>See what readers see</span>
            </Link>
          </div>
        </section>
      </div>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>AI auto-publish history</h2>
        </div>
        {!logs || logs.length === 0 ? (
          <p className="admin-empty">
            No generation runs yet. Daily cron publishes 2 articles at 9:00
            PM IST via <code>/api/cron/generate-article</code>.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Status</th>
                  <th>Topic / title</th>
                  <th>Article</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const article = (
                    log as unknown as {
                      article?: { slug: string; title: string };
                    }
                  ).article;
                  return (
                    <tr key={log.id}>
                      <td className="admin-td-now">
                        {new Date(log.run_at).toLocaleString()}
                      </td>
                      <td>
                        <span className={`admin-badge ${log.status}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>{log.topic_searched ?? "-"}</td>
                      <td>
                        {article ? (
                          <Link href={`/article/${article.slug}`} target="_blank">
                            {article.title}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="admin-td-error">
                        {log.error_message ?? ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
