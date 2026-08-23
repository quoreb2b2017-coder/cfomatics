import { createClient } from "@/lib/supabase/server";
import { createArticle } from "@/lib/actions/articles";
import ArticleForm from "@/components/admin/ArticleForm";

export default async function NewArticlePage() {
  const supabase = await createClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("name");

  return (
    <>
      <h1>New article</h1>
      <ArticleForm action={createArticle} topics={topics ?? []} />
    </>
  );
}
