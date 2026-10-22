import { revalidatePath, revalidateTag } from "next/cache";

export {
  CFOMATICS_LINKEDIN_URL,
  getPublicSiteUrl,
  getSiteUrl,
  linkedInShareUrl,
} from "@/lib/public-site";

/** Bust cached sitemap, RSS, homepage data, and public routes after publish. */
export function revalidateSitemap() {
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
  revalidatePath("/feed.xml");
  revalidatePath("/rss.xml");
  revalidateTag("homepage", "max");
  revalidateTag("articles", "max");
  revalidateTag("topics", "max");
}
