import { buildRssXml, rssResponse } from "@/lib/rss";

/** Refresh at least every 5 minutes; publish paths also revalidate this route. */
export const revalidate = 300;

export async function GET() {
  const xml = await buildRssXml();
  return rssResponse(xml);
}
