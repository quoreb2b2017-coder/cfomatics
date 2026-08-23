import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Topic } from "@/types/database";

export const getTopics = cache(async (): Promise<Topic[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("getTopics failed:", error.message);
    return [];
  }
  return data ?? [];
});

export const getTopicBySlug = cache(
  async (slug: string): Promise<Topic | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("getTopicBySlug failed:", error.message);
      return null;
    }
    return data;
  },
);
