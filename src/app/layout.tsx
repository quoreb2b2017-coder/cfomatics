import type { Metadata } from "next";
import localFont from "next/font/local";
import AlliScript from "@/components/AlliScript";
import ClientEffects from "@/components/ClientEffects";
import CookieConsentShell from "@/components/CookieConsentShell";
import JsonLd from "@/components/JsonLd";
import SubscribePopup from "@/components/SubscribePopup";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const SITE_URL = getSiteUrl();

// Self-hosted so builds do not fetch Google Fonts. Turbopack fails when
// Google returns an extensionless font URL (next/font/google queries have
// exactly one entry). weight ranges are required or variable faces collapse to 400.
const newsreader = localFont({
  src: [
    {
      path: "../fonts/newsreader-latin-wght-normal.woff2",
      weight: "200 800",
      style: "normal",
    },
    {
      path: "../fonts/newsreader-latin-wght-italic.woff2",
      weight: "200 800",
      style: "italic",
    },
  ],
  variable: "--font-newsreader",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const inter = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = localFont({
  src: [
    {
      path: "../fonts/ibm-plex-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-mono-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CFOmatics - Financial News & Analysis for Finance Leaders",
    template: "%s - CFOmatics",
  },
  description:
    "CFOmatics delivers news and analysis for CFOs and finance leaders across financial reporting, FP&A, treasury, risk, tax, technology, and leadership.",
  alternates: {
    types: {
      "application/rss+xml": [
        {
          url: "/feed.xml",
          title: "CFOmatics RSS",
        },
      ],
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${newsreader.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        {/* Raw tag, not next/script: AdSense looks for this exact script in the HTML <head>. */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9744557344146713"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <AlliScript />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "CFOmatics",
            url: SITE_URL,
            logo: `${SITE_URL}/brand/mark.svg`,
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "CFOmatics",
            url: SITE_URL,
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }}
        />
        {children}
        <ClientEffects />
        <SubscribePopup siteWide />
        <CookieConsentShell />
      </body>
    </html>
  );
}
