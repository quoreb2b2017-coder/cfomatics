import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import DownloadForm from "@/components/resources/DownloadForm";
import ResourceSplit from "@/components/resources/ResourceSplit";
import SponsorBar from "@/components/resources/SponsorBar";
import { categoryLabel, sectionByKey } from "@/lib/resources";
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
  if (!meta || !("category" in meta)) return {};
  const resource = await getPublishedResource(meta.category as ResourceCategory, slug);
  if (!resource) return {};
  return {
    title: resource.meta_title || resource.title,
    description: resource.meta_description || resource.description,
    keywords: resource.keywords || undefined,
  };
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { section, slug } = await params;
  const meta = sectionByKey(section);
  if (!meta || !("category" in meta)) notFound();
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
