import { createClient } from "@/lib/supabase/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import RowDeleteButton from "@/components/admin/RowDeleteButton";
import { isMailConfigured } from "@/lib/email";
import { leadFromNote, leadLabel } from "@/lib/resources";
import type { SubscriberInterest } from "@/types/database";

function reasonText(raw?: string | null) {
  if (!raw) return "—";
  const note = leadFromNote(raw);
  if (note?.reason) return note.reason;
  if (note) return "—";
  return raw;
}

type SubscriberRow = {
  id: string;
  email: string;
  created_at: string;
  unsubscribed_at: string | null;
  unsubscribe_reason?: string | null;
  source_type?: string | null;
  source_slug?: string | null;
  source_title?: string | null;
  interests: SubscriberInterest[] | null;
};

export default async function AdminSubscribersPage() {
  const supabase = await createClient();
  const withSource = await supabase
    .from("subscribers")
    .select(
      "id, email, created_at, unsubscribed_at, unsubscribe_reason, source_type, source_slug, source_title, interests:subscriber_interests(*)",
    )
    .order("created_at", { ascending: false });
  const fallback =
    withSource.error && /source_type|column/i.test(withSource.error.message)
      ? await supabase
          .from("subscribers")
          .select(
            "id, email, created_at, unsubscribed_at, unsubscribe_reason, interests:subscriber_interests(*)",
          )
          .order("created_at", { ascending: false })
      : null;
  const data = fallback ? fallback.data : withSource.data;
  const error = fallback ? fallback.error : withSource.error;

  const subscribers = (data ?? []) as SubscriberRow[];
  const mailReady = isMailConfigured();

  return (
    <>
      <AdminPageHeader
        kicker="Audience"
        title="Subscribes"
        description={`${subscribers.length} email${subscribers.length === 1 ? "" : "s"} captured from the public site.`}
      />

      {!mailReady && (
        <p className="admin-empty" style={{ marginBottom: 16 }}>
          SMTP is not set. Subscribers will still save here, but related-article
          emails will not send until <code>SMTP_HOST</code>,{" "}
          <code>SMTP_USER</code>, and <code>SMTP_PASS</code> are in the
          environment.
        </p>
      )}

      {error && (
        <p className="admin-empty" style={{ marginBottom: 16 }}>
          Could not load subscribers. Run{" "}
          <code>supabase/subscribers.sql</code> in the Supabase SQL Editor.
          {error.message ? ` (${error.message})` : ""}
        </p>
      )}

      <div className="admin-card admin-card--flush">
        <div className="admin-table-scroll">
          <table className="admin-table admin-table--audience">
            <thead>
              <tr>
                <th>Email</th>
                <th>Page</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((row) => {
                const note = leadFromNote(row.unsubscribe_reason);
                const page =
                  leadLabel(row.source_type || note?.type, row.source_title || note?.title) ||
                  row.interests?.find((interest) => interest.article_title)?.article_title ||
                  "Site";
                return (
                  <tr key={row.id}>
                    <td>
                      <a href={`mailto:${row.email}`}>{row.email}</a>
                    </td>
                    <td>{page}</td>
                    <td className={row.unsubscribed_at ? "admin-status-out" : "admin-status-in"}>
                      {row.unsubscribed_at ? "Unsubscribed" : "Subscribed"}
                    </td>
                    <td className="admin-td-reason">{reasonText(row.unsubscribe_reason)}</td>
                    <td className="admin-td-now">
                      {new Date(row.unsubscribed_at || row.created_at).toLocaleString()}
                    </td>
                    <td>
                      <RowDeleteButton id={row.id} kind="subscribe" />
                    </td>
                  </tr>
                );
              })}
              {subscribers.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    No subscribers yet. Emails appear here after someone
                    submits a subscribe form.
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
