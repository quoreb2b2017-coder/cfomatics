import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { isMailConfigured } from "@/lib/email";
import type { SubscriberInterest } from "@/types/database";

type SubscriberRow = {
  id: string;
  email: string;
  created_at: string;
  unsubscribed_at: string | null;
  interests: SubscriberInterest[] | null;
};

export default async function AdminSubscribersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select(
      "id, email, created_at, unsubscribed_at, interests:subscriber_interests(*)",
    )
    .order("created_at", { ascending: false });

  const subscribers = (data ?? []) as SubscriberRow[];
  const mailReady = isMailConfigured();

  return (
    <>
      <AdminPageHeader
        kicker="Audience"
        title="Subscribers"
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
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Subscribed regarding</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((row) => {
                const interests = row.interests ?? [];
                return (
                  <tr key={row.id}>
                    <td>
                      <a href={`mailto:${row.email}`}>{row.email}</a>
                    </td>
                    <td>
                      {interests.length === 0 ? (
                        <span className="admin-td-sub">All CFOmatics stories</span>
                      ) : (
                        <ul className="admin-sub-blogs">
                          {interests.map((interest) => (
                            <li key={interest.id}>
                              {interest.article_slug && interest.article_title ? (
                                <Link href={`/article/${interest.article_slug}`}>
                                  {interest.article_title}
                                </Link>
                              ) : (
                                <span>
                                  {interest.topic_name || "All CFOmatics stories"}
                                </span>
                              )}
                              {interest.topic_name && interest.article_title ? (
                                <div className="admin-td-sub">
                                  {interest.topic_name}
                                </div>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="admin-td-now">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${row.unsubscribed_at ? "draft" : "published"}`}
                      >
                        {row.unsubscribed_at ? "unsubscribed" : "active"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {subscribers.length === 0 && !error && (
                <tr>
                  <td colSpan={4} className="admin-empty">
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
