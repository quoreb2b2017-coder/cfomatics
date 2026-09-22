import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CookiePreferencesTrigger from "@/components/CookiePreferencesTrigger";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How CFOmatics collects, uses, and protects information — including cookies, first-party analytics, and your privacy choices.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <div className="wrap">
        <div className="thero">
          <span className="kicker k">Legal</span>
          <h1>Privacy Policy</h1>
          <p>
            Last updated {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            . This policy explains how CFOmatics (published by Quore B2B
            Marketing) processes information when you visit{" "}
            <a href="https://www.cfomatics.com">www.cfomatics.com</a>.
          </p>
        </div>
      </div>

      <div className="wrap">
        <main className="prose" style={{ maxWidth: 720, fontSize: 18 }}>
          <h2 id="overview">Overview</h2>
          <p>
            We publish financial news and analysis for finance leaders. We
            process limited technical and preference data to run the site
            securely, measure audience interest with your consent, and respond
            to newsletter or partnership requests.
          </p>

          <h2 id="cookies">Cookies and similar technologies</h2>
          <p>
            We use first-party cookies. You can change your choices anytime via{" "}
            <CookiePreferencesTrigger className="cookie-inline-link" /> in the
            site footer, or reopen the banner from that link. Browsing is never
            blocked behind the consent bar.
          </p>

          <h3>Strictly necessary</h3>
          <p>
            Always on. These cookies store your consent decision (
            <code>cfo_consent</code>, ~180 days), keep the site secure, and
            support basic navigation. They cannot be disabled through the
            preferences panel.
          </p>

          <h3>Analytics (optional)</h3>
          <p>
            When you opt in, we set an anonymous visitor id (
            <code>cfo_vid</code>, ~400 days) and send first-party page-view
            events to our own servers. If Google Analytics is configured, we
            load it only under Google Consent Mode with{" "}
            <code>analytics_storage</code> (and related advertising signals)
            defaulting to <strong>denied</strong> until you grant analytics
            consent. We do not send GA hits before that grant.
          </p>

          <h3>Marketing / attribution (optional)</h3>
          <p>
            When you opt in, we may store a first-touch attribution cookie (
            <code>cfo_attr</code>, ~90 days) with landing path, timestamp, and
            UTM parameters. Turning marketing off deletes this cookie
            immediately. Affiliate or campaign measurement uses this category;
            it is never enabled without your choice.
          </p>

          <h2 id="analytics">First-party analytics and geo</h2>
          <p>
            With analytics consent, we record approximate page views for product
            and editorial improvement. Events may include path, referrer host,
            device/viewport hints, browser time zone, language, and truncated
            UTMs. We resolve approximate country/city/region from edge/CDN
            headers when available. Client IPs used for consent audit are{" "}
            <strong>pseudonymized</strong> (IPv4 last octet zeroed; IPv6
            truncated). We do not store full email addresses in cookies or
            analytics — if an email appears in a URL, we keep the domain only.
          </p>
          <p>
            Analytics event retention is minimized to about{" "}
            <strong>180 days</strong>, after which records are deleted.
          </p>

          <h2 id="newsletter">Newsletter and forms</h2>
          <p>
            If you subscribe or submit a lead form, we process the email and
            related context you provide to deliver the CFOmatics newsletter or
            partner materials you requested. You can{" "}
            <Link href="/unsubscribe">unsubscribe</Link> at any time.
          </p>

          <h2 id="sharing">Sharing and processors</h2>
          <p>
            We use infrastructure providers (for example hosting and database
            services) to operate the site. Optional Google Analytics runs only
            with analytics consent. We do not sell personal information. US and
            other cross-border processing may occur where our processors
            operate; we apply appropriate safeguards for transfers.
          </p>

          <h2 id="rights">Your rights and choices</h2>
          <p>
            Depending on your location, you may have rights to access, correct,
            delete, or restrict certain processing, and to object to marketing.
            Use <CookiePreferencesTrigger className="cookie-inline-link" /> to
            update cookie categories. For privacy requests contact{" "}
            <a href="mailto:editorial@cfomatics.com">editorial@cfomatics.com</a>
            .
          </p>

          <h2 id="contact">Contact</h2>
          <p>
            CFOmatics · Published by Quore B2B Marketing
            <br />
            Privacy:{" "}
            <a href="mailto:editorial@cfomatics.com">editorial@cfomatics.com</a>
            <br />
            Partners:{" "}
            <a href="mailto:partners@cfomatics.com">partners@cfomatics.com</a>
          </p>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
