"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/articles";
import { revalidateSitemap } from "@/lib/site";

export async function createTopic(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  const description = String(formData.get("description") ?? "") || null;

  const { error } = await supabase
    .from("topics")
    .insert({ name, slug, description });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/topics");
  revalidateSitemap();
  redirect("/admin/topics");
}

export async function updateTopic(id: string, formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "");
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  const description = String(formData.get("description") ?? "") || null;

  const { error } = await supabase
    .from("topics")
    .update({ name, slug, description })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/topics");
  revalidateSitemap();
  redirect("/admin/topics");
}

export async function deleteTopic(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("topics").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/topics");
  revalidateSitemap();
}
