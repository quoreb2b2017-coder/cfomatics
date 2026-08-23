import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  deleteArticle,
  toggleArticleStatus,
} from "@/lib/actions/articles";
import type { ArticleWithTopic } from "@/types/database";

export default async function AdminArticlesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*, topic:topics(*)")
    .order("created_at", { ascending: false });

  const articles = (data ?? []) as unknown as ArticleWithTopic[];

  return (
    <>
      <div className="admin-toolbar">
        <h1 style={{ marginBottom: 0 }}>Articles</h1>
        <Link href="/admin/articles/new" className="btn btn-solid">
          + New article
        </Link>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Topic</th>
              <th>Status</th>
              <th>Source</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link href={`/admin/articles/${a.id}/edit`}>{a.title}</Link>
                </td>
                <td>{a.topic?.name ?? "—"}</td>
                <td>
                  <span className={`admin-badge ${a.status}`}>{a.status}</span>
                </td>
                <td>{a.source}</td>
                <td>{new Date(a.updated_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <form
                      action={toggleArticleStatus.bind(
                        null,
                        a.id,
                        a.status === "published" ? "draft" : "published",
                      )}
                    >
                      <button type="submit" className="btn btn-ghost">
                        {a.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <form action={deleteArticle.bind(null, a.id)}>
                      <button type="submit" className="btn btn-ghost">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: "var(--ink-2)" }}>
                  No articles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
