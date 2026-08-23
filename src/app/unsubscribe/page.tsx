import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { unsubscribeByToken } from "@/lib/subscribers";

export const metadata: Metadata = {
  title: "Unsubscribe - CFOmatics",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = token ? await unsubscribeByToken(token) : false;

  return (
    <>
      <SiteHeader />
      <div className="wrap" style={{ padding: "80px 0", maxWidth: 640 }}>
        <span className="kicker k">Newsletter</span>
        <h1 style={{ fontFamily: "var(--font-newsreader), serif", marginTop: 8 }}>
          {ok ? "You are unsubscribed" : "Unsubscribe link is invalid"}
        </h1>
        <p style={{ color: "var(--ink-2)", marginTop: 12, fontSize: 18 }}>
          {ok
            ? "You will no longer get related-article emails from CFOmatics. You can subscribe again from any story."
            : "This unsubscribe link is missing or expired. If you still receive emails, reply to that message and we will take you off the list."}
        </p>
        <p style={{ marginTop: 24 }}>
          <Link href="/" className="btn btn-solid">
            Back to CFOmatics
          </Link>
        </p>
      </div>
      <SiteFooter />
    </>
  );
}
