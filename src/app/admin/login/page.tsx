import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin login - CFOmatics",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="admin-login">
      <div className="admin-login-box">
        <h1>CFOmatics Admin</h1>
        <p className="sub">Sign in to manage articles and topics.</p>
        <LoginForm next={next ?? "/admin"} />
      </div>
    </div>
  );
}
