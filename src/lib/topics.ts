import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Topic } from "@/types/database";

const fetchTopicsCached = unstable_cache(
  async (): Promise<Topic[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("topics")
      .select("id, slug, name, description, created_at")
      .order("name", { ascending: true });

    if (error) {
      console.error("getTopics failed:", error.message);
      return [];
    }
    return data ?? [];
  },
  ["cfomatics-topics-v1"],
  { revalidate: 300, tags: ["topics"] },
);

export const getTopics = cache(async (): Promise<Topic[]> => fetchTopicsCached());

const fetchTopicBySlugCached = unstable_cache(
  async (slug: string): Promise<Topic | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("topics")
      .select("id, slug, name, description, created_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("getTopicBySlug failed:", error.message);
      return null;
    }
    return data;
  },
  ["cfomatics-topic-by-slug-v1"],
  { revalidate: 300, tags: ["topics"] },
);

export const getTopicBySlug = cache(
  async (slug: string): Promise<Topic | null> => fetchTopicBySlugCached(slug),
);
