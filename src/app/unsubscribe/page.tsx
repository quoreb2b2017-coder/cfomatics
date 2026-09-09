import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import UnsubscribeForm from "@/components/UnsubscribeForm";
import { unsubscribeByToken } from "@/lib/subscribers";

export const metadata: Metadata = {
  title: "Unsubscribe - CFOmatics",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string; email?: string }>;
}) {
  const { token, done, email } = await searchParams;
  const tokenOk = token ? await unsubscribeByToken(token) : false;
  const success = tokenOk || done === "1";

  return (
    <>
      <SiteHeader />
      <main className="unsub-page">
        <div className="wrap unsub-wrap">
          {success ? (
            <div className="unsub-card">
              <header className="unsub-card-head">
                <Link href="/" className="unsub-close" aria-label="Close">
                  ×
                </Link>
                <p className="unsub-brand-word">
                  CFO<span>matics</span>
                </p>
                <p className="unsub-card-title">You are unsubscribed</p>
              </header>
              <div className="unsub-card-body">
                <p className="unsub-lead">
                  You will no longer get related-article emails from CFOmatics.
                  You can subscribe again anytime from a story or the homepage.
                </p>
                <Link href="/" className="unsub-submit unsub-submit--link">
                  Back to CFOmatics
                </Link>
              </div>
            </div>
          ) : (
            <UnsubscribeForm initialEmail={email ?? ""} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
