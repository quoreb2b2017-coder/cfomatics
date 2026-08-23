import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTopic } from "@/lib/actions/topics";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default async function EditTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!topic) notFound();

  return (
    <>
      <AdminPageHeader
        kicker="Taxonomy"
        title="Edit topic"
        description={topic.name}
        backHref="/admin/topics"
        backLabel="Topics"
      />
      <div className="admin-card">
        <form action={updateTopic.bind(null, id)}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" defaultValue={topic.name} required />
          </div>
          <div className="field">
            <label htmlFor="slug">Slug</label>
            <input id="slug" name="slug" defaultValue={topic.slug} />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              name="description"
              defaultValue={topic.description ?? ""}
            />
          </div>
          <button type="submit" className="btn btn-solid">
            Save changes
          </button>
        </form>
      </div>
    </>
  );
}
