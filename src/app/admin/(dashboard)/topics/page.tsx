import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createTopic, deleteTopic } from "@/lib/actions/topics";

export default async function AdminTopicsPage() {
  const supabase = await createClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("name");

  return (
    <>
      <h1>Topics</h1>

      <div className="admin-card">
        <h2>Add a topic</h2>
        <form action={createTopic}>
          <div style={{ display: "flex", gap: 16 }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required />
            </div>
            <div className="field" style={{ flex: 1 }}>
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

      <div className="admin-card">
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
                <td>{t.slug}</td>
                <td>{t.description}</td>
                <td>
                  <form action={deleteTopic.bind(null, t.id)}>
                    <button type="submit" className="btn btn-ghost">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
