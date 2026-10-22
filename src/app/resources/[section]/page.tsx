import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ResourceHero from "@/components/resources/ResourceHero";
import ResourceLibrary from "@/components/resources/ResourceLibrary";
import ComingSoon from "@/components/resources/ComingSoon";
import { SITE_NAME, sectionByKey } from "@/lib/resources";
import { listPublishedResources } from "@/lib/resources-public";
import type { ResourceCategory } from "@/types/database";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const meta = sectionByKey(section);
  if (!meta || !("category" in meta)) return {};
  return {
    title: `${meta.label} - ${SITE_NAME}`,
    description: meta.blurb,
  };
}

export default async function ResourceSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const meta = sectionByKey(section);
  if (!meta || !("category" in meta)) notFound();
  const items = await listPublishedResources(meta.category as ResourceCategory);

  return (
    <>
      <SiteHeader />
      <ResourceHero
        badge={meta.label}
        title={meta.label}
        lede={meta.blurb}
        pillars={meta.pillars}
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/resources", label: "Resources" },
          { label: meta.label },
        ]}
      />
      {items.length === 0 ? (
        <ComingSoon label={meta.label} />
      ) : (
        <ResourceLibrary items={items} />
      )}
      <SiteFooter />
    </>
  );
}
