import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createTopic, deleteTopic } from "@/lib/actions/topics";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default async function AdminTopicsPage() {
  const supabase = await createClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("name");

  return (
    <>
      <AdminPageHeader
        kicker="Taxonomy"
        title="Topics"
        description="These names appear in the public navbar and topic sections."
      />

      <div className="admin-card">
        <div className="admin-card-head">
          <h2>Add a topic</h2>
        </div>
        <form action={createTopic} className="admin-inline-form">
          <div className="admin-form-row">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="slug">Slug (optional)</label>
              <input id="slug" name="slug" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <input id="description" name="description" />
          </div>
          <button type="submit" className="btn btn-solid">
            Add topic
          </button>
        </form>
      </div>

      <div className="admin-card admin-card--flush">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(topics ?? []).map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/admin/topics/${t.id}/edit`}>{t.name}</Link>
                  </td>
                  <td>
                    <code>{t.slug}</code>
                  </td>
                  <td>{t.description}</td>
                  <td>
                    <div className="admin-row-actions">
                      <Link
                        href={`/admin/topics/${t.id}/edit`}
                        className="btn btn-solid"
                      >
                        Edit
                      </Link>
                      <form action={deleteTopic.bind(null, t.id)}>
                        <button type="submit" className="btn btn-ghost">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
