import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  deleteArticle,
  toggleArticleStatus,
} from "@/lib/actions/articles";
import type { ArticleWithTopic } from "@/types/database";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { hydrateArticleSeo } from "@/lib/seo";

export default async function AdminArticlesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*, topic:topics(*)")
    .order("created_at", { ascending: false });

  const articles = (data ?? []) as unknown as ArticleWithTopic[];

  return (
    <>
      <AdminPageHeader
        kicker="Content"
        title="Articles"
        description={`${articles.length} stor${articles.length === 1 ? "y" : "ies"} in the CMS.`}
        action={
          <Link href="/admin/articles/new#generate" className="btn btn-solid">
            New article
          </Link>
        }
      />

      <div className="admin-card admin-card--flush">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title / H1</th>
                <th>Meta title</th>
                <th>Keywords</th>
                <th>Topic</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => {
                const seo = hydrateArticleSeo(a, a.topic?.name);
                return (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/articles/${a.id}/edit`}>{a.title}</Link>
                    <div className="admin-td-sub">H1 · {a.title.length} chars</div>
                  </td>
                  <td>
                    <span className="admin-seo-cell">{seo.metaTitle}</span>
                    <div className="admin-td-sub">
                      {seo.metaTitle.length}/60 · OG: {seo.ogTitle.slice(0, 42)}
                      {seo.ogTitle.length > 42 ? "…" : ""}
                    </div>
                  </td>
                  <td>
                    <span className="admin-seo-cell">{seo.keywords}</span>
                    <div className="admin-td-sub">
                      AEO {seo.aeoAnswer ? "yes" : "derived"} · GEO{" "}
                      {seo.geoSummary ? "yes" : "derived"}
                    </div>
                  </td>
                  <td>{a.topic?.name ?? "-"}</td>
                  <td>
                    <span className={`admin-badge ${a.status}`}>{a.status}</span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link
                        href={`/admin/articles/${a.id}/edit`}
                        className="btn btn-solid"
                      >
                        Edit
                      </Link>
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
                );
              })}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    No articles yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
