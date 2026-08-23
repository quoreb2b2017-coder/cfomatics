import type { Metadata } from "next";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
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
      <div className="admin-login-panel">
        <aside className="admin-login-aside">
          <BrandLogo variant="onDark" />
          <span className="admin-login-kicker">Staff access</span>
          <h1>Control center</h1>
          <p>
            Sign in to publish stories, manage topics, and review AI
            auto-publish runs.
          </p>
          <ul>
            <li>Articles and drafts</li>
            <li>Navbar topics</li>
            <li>Publishing history</li>
          </ul>
        </aside>
        <div className="admin-login-box">
          <h2>Sign in</h2>
          <p className="sub">Use your CFOmatics admin email and password.</p>
          <LoginForm next={next ?? "/admin"} />
          <Link href="/" className="admin-login-back">
            ← Back to public site
          </Link>
        </div>
      </div>
    </div>
  );
}
