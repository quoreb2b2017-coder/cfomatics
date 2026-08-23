import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTopic } from "@/lib/actions/topics";

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
      <h1>Edit topic</h1>
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
