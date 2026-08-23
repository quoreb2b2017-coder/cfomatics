  import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateArticle } from "@/lib/actions/articles";
import ArticleForm from "@/components/admin/ArticleForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: article }, { data: topics }] = await Promise.all([
    supabase.from("articles").select("*").eq("id", id).maybeSingle(),
    supabase.from("topics").select("*").order("name"),
  ]);

  if (!article) notFound();

  return (
    <>
      <h1>Edit article</h1>
      <ArticleForm
        action={updateArticle.bind(null, id)}
        article={article}
        topics={topics ?? []}
      />
    </>
  );
}
