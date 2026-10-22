import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { normalizeResource } from "@/lib/resources";
import type { ResourceCategory, ResourceItem } from "@/types/database";

export async function listPublishedResources(category?: ResourceCategory) {
  const supabase = createPublicClient();
  let query = supabase
    .from("resources")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) {
    console.error("listPublishedResources:", error.message);
    return [] as ResourceItem[];
  }
  return ((data ?? []) as ResourceItem[]).map(normalizeResource);
}

export async function getPublishedResource(category: ResourceCategory, slug: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("status", "published")
    .eq("category", category)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getPublishedResource:", error.message);
    return null;
  }
  return data ? normalizeResource(data as ResourceItem) : null;
}
