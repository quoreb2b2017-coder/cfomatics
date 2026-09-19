import { buildRssXml, rssResponse } from "@/lib/rss";

/** Alias of /feed.xml for LinkedIn and older RSS clients. */
export const revalidate = 300;

export async function GET() {
  const xml = await buildRssXml();
  return rssResponse(xml);
}
