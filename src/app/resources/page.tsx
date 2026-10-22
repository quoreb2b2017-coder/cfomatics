import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ResourceHero from "@/components/resources/ResourceHero";
import { RESOURCE_SECTIONS, SITE_NAME } from "@/lib/resources";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Resources - ${SITE_NAME}`,
  description: `White papers, reports, case studies, guides, and webinars from ${SITE_NAME}.`,
};

export default function ResourcesHubPage() {
  return (
    <>
      <SiteHeader />
      <ResourceHero
        badge="Resources"
        title="Research and briefings for the office of the CFO"
        lede={`${SITE_NAME} publishes the reporting, the longer research, and the sessions finance leaders use in the work.`}
        pillars={["Research", "Briefings", "Practice"]}
        crumbs={[{ href: "/", label: "Home" }, { label: "Resources" }]}
      />
      <div className="wrap res-hub">
        {RESOURCE_SECTIONS.map((section) => (
          <Link key={section.key} href={section.href} className="res-hub-card">
            <span className="res-hub-n">{section.n}</span>
            <h2>{section.label}</h2>
            <p>{section.blurb}</p>
          </Link>
        ))}
      </div>
      <SiteFooter />
    </>
  );
}
