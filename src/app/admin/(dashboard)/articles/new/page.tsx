import { createClient } from "@/lib/supabase/server";
import { createArticle } from "@/lib/actions/articles";
import ArticleForm from "@/components/admin/ArticleForm";
import AiGenerateForm from "@/components/admin/AiGenerateForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default async function NewArticlePage() {
  const supabase = await createClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("name");

  const list = topics ?? [];

  return (
    <>
      <AdminPageHeader
        kicker="Content"
        title="New article"
        description="Pick a topic and titles to auto-generate the full story, cover, and SEO - or write it by hand."
        backHref="/admin/articles"
        backLabel="Articles"
      />
      <AiGenerateForm topics={list} />
      <p className="admin-or">Or write it yourself</p>
      <ArticleForm action={createArticle} topics={list} />
    </>
  );
}
