import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import DownloadForm from "@/components/resources/DownloadForm";
import ResourceSplit from "@/components/resources/ResourceSplit";
import SponsorBar from "@/components/resources/SponsorBar";
import { categoryLabel, sectionByKey, SITE_NAME } from "@/lib/resources";
import { getPublishedResource } from "@/lib/resources-public";
import type { ResourceCategory } from "@/types/database";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}): Promise<Metadata> {
  const { section, slug } = await params;
  const meta = sectionByKey(section);
  if (!meta || !("category" in meta) || meta.key === "guides") return {};
  const resource = await getPublishedResource(meta.category as ResourceCategory, slug);
  if (!resource) return {};
  return {
    title: `Download ${resource.title} - ${SITE_NAME}`,
    description: resource.description,
  };
}

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { section, slug } = await params;
  const meta = sectionByKey(section);
  if (!meta || !("category" in meta) || meta.key === "guides") notFound();
  const resource = await getPublishedResource(meta.category as ResourceCategory, slug);
  if (!resource) notFound();

  return (
    <>
      <SiteHeader />
      <ResourceSplit resource={resource} sectionLabel={meta.label} sectionHref={meta.href}>
        <DownloadForm resource={resource} />
      </ResourceSplit>
      <SponsorBar kind={categoryLabel(resource.category).toLowerCase()} />
      <SiteFooter />
    </>
  );
}
