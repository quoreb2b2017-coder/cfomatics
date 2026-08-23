import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="brand-mini">
          <span className="brand-mark" aria-hidden>
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="12" fill="#15181C" />
              <path
                d="M44.5 22.2C41.8 18.6 37.2 16.2 32 16.2c-8.7 0-15.8 7.1-15.8 15.8S23.3 47.8 32 47.8c5.2 0 9.8-2.4 12.5-6"
                stroke="#37B98C"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M24 38.5 L31.2 30.8 L36.4 35.2 L45.5 24.5"
                stroke="#FCFCFB"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="45.5" cy="24.5" r="3.2" fill="#A9812F" />
            </svg>
          </span>
          <span>
            CFO<span style={{ color: "var(--emerald-l)" }}>matics</span> Admin
          </span>
        </Link>
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/articles">Articles</Link>
        <Link href="/admin/topics">Topics</Link>
        <Link href="/" target="_blank">
          View site ↗
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="btn btn-ghost"
            style={{
              width: "100%",
              justifyContent: "center",
              color: "#fff",
              borderColor: "rgba(255,255,255,.3)",
            }}
          >
            Sign out
          </button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
