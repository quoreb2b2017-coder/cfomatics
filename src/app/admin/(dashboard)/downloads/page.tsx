import AdminPageHeader from "@/components/admin/AdminPageHeader";
import RowDeleteButton from "@/components/admin/RowDeleteButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DownloadRow = {
  id: string;
  email: string;
  fields: Record<string, string> | null;
  created_at: string;
  resource: { title: string } | { title: string }[] | null;
};

export default async function AdminDownloadsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_downloads")
    .select("id, email, fields, created_at, resource:resources(title)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as DownloadRow[];

  return (
    <>
      <AdminPageHeader
        kicker="Audience"
        title="Downloads"
        description="Emails captured when someone downloads a resource."
      />
      {error && (
        <p className="admin-empty" style={{ marginBottom: 16 }}>
          Could not load downloads. Run <code>supabase/resources.sql</code> in the Supabase SQL Editor.
          {error.message ? ` (${error.message})` : ""}
        </p>
      )}
      <div className="admin-card admin-card--flush">
        <div className="admin-table-scroll">
          <table className="admin-table admin-table--audience">
            <thead>
              <tr>
                <th>Email</th>
                <th>Resource</th>
                <th>First name</th>
                <th>Last name</th>
                <th>Zip</th>
                <th>Phone</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const resource = Array.isArray(row.resource) ? row.resource[0] : row.resource;
                const fields = row.fields ?? {};
                return (
                  <tr key={row.id}>
                    <td>{row.email}</td>
                    <td className="admin-td-title">{resource?.title || "—"}</td>
                    <td>{fields.first_name || "—"}</td>
                    <td>{fields.last_name || "—"}</td>
                    <td>{fields.zip || "—"}</td>
                    <td>{fields.phone || "—"}</td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                    <td>
                      <RowDeleteButton id={row.id} kind="download" />
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && !error && (
                <tr>
                  <td colSpan={8}>No downloads yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
